import { collection, getDocs, query, where, doc, updateDoc, runTransaction, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';

// Migration function to update vote types from 'oppose' to 'opposition'
export const migrateOpposeVotes = async () => {
  try {
    console.log('Starting vote migration: oppose -> opposition');
    
    // Query all boycottVotes with vote = 'oppose'
    const q = query(
      collection(db, 'boycottVotes'),
      where('vote', '==', 'oppose')
    );
    
    const querySnapshot = await getDocs(q);
    const totalVotes = querySnapshot.size;
    console.log(`Found ${totalVotes} votes to migrate`);
    
    if (totalVotes === 0) {
      return { success: true, migrated: 0, failed: 0, message: 'No votes found to migrate' };
    }
    
    // Group votes by boycottId to efficiently update boycott documents
    const votesByBoycott = {};
    
    // Process votes in batches to avoid hitting quota limits
    let successCount = 0;
    let failCount = 0;
    const maxBatchSize = 500; // Firestore has a limit of 500 operations per batch
    let currentBatch = writeBatch(db);
    let operationCount = 0;
    
    // First pass: Organize votes by boycott and update vote documents
    for (const voteDoc of querySnapshot.docs) {
      try {
        const voteData = voteDoc.data();
        const boycottId = voteData.boycottId;
        
        // Track votes by boycott for counter updates
        if (!votesByBoycott[boycottId]) {
          votesByBoycott[boycottId] = 0;
        }
        votesByBoycott[boycottId]++;
        
        // Add vote document update to batch
        const voteRef = doc(db, 'boycottVotes', voteDoc.id);
        currentBatch.update(voteRef, {
          vote: 'opposition'
        });
        
        operationCount++;
        
        // If batch is full, commit it and start a new one
        if (operationCount >= maxBatchSize) {
          await currentBatch.commit();
          console.log(`Committed batch with ${operationCount} operations`);
          currentBatch = writeBatch(db);
          operationCount = 0;
        }
      } catch (error) {
        failCount++;
        console.error(`Failed to process vote ${voteDoc.id}:`, error);
      }
    }
    
    // Commit any remaining vote updates
    if (operationCount > 0) {
      await currentBatch.commit();
      console.log(`Committed final batch with ${operationCount} operations`);
    }
    
    // Second pass: Update boycott counters
    console.log(`Updating counters for ${Object.keys(votesByBoycott).length} boycotts`);
    currentBatch = writeBatch(db);
    operationCount = 0;
    
    for (const [boycottId, voteCount] of Object.entries(votesByBoycott)) {
      try {
        // Get current boycott document to check if it exists
        const boycottRef = doc(db, 'boycotts', boycottId);
        const boycottDoc = await getDoc(boycottRef);
        
        if (boycottDoc.exists()) {
          // Update boycott counters
          const boycottData = boycottDoc.data();
          
          // Calculate new counter values
          const currentOpposeCount = boycottData.opposeCount || 0;
          const currentOppositionCount = boycottData.oppositionCount || 0;
          
          // Update the document
          currentBatch.update(boycottRef, {
            // Reduce opposeCount by the number of migrated votes
            opposeCount: Math.max(0, currentOpposeCount - voteCount),
            // Increase oppositionCount by the same amount
            oppositionCount: currentOppositionCount + voteCount
          });
          
          operationCount++;
          successCount += voteCount;
          
          // If batch is full, commit it and start a new one
          if (operationCount >= maxBatchSize) {
            await currentBatch.commit();
            console.log(`Committed boycott counter batch with ${operationCount} operations`);
            currentBatch = writeBatch(db);
            operationCount = 0;
          }
        } else {
          console.warn(`Boycott ${boycottId} not found but has votes. Skipping counter update.`);
          failCount += voteCount;
        }
      } catch (error) {
        failCount += voteCount;
        console.error(`Failed to update counters for boycott ${boycottId}:`, error);
      }
    }
    
    // Commit any remaining boycott counter updates
    if (operationCount > 0) {
      await currentBatch.commit();
      console.log(`Committed final boycott counter batch with ${operationCount} operations`);
    }
    
    console.log(`Migration complete! Success: ${successCount}, Failed: ${failCount}`);
    return { 
      success: true, 
      migrated: successCount, 
      failed: failCount,
      message: `Successfully migrated ${successCount} votes from 'oppose' to 'opposition'`
    };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error: error.message };
  }
};

// Execute migration automatically when module is imported
// Comment this out when migration is complete
// migrateOpposeVotes(); 