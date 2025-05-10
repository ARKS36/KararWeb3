import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, serverTimestamp, arrayUnion, increment, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import '../styles/protest.css';
import { FaCalendarAlt, FaMapMarkerAlt, FaThumbsUp, FaThumbsDown, FaFlag, FaArrowRight, FaShieldAlt } from 'react-icons/fa';
import { MdClose } from 'react-icons/md';

function Protest({ protest, showActions = true }) {
  const { id, title, description, company, category, imageUrl, createdBy, createdAt } = protest;
  const { currentUser } = useAuth();
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [voteType, setVoteType] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [voteStatus, setVoteStatus] = useState('none');
  const [voteCounts, setVoteCounts] = useState({
    upvotes: protest.supportCount || 0,
    downvotes: protest.oppositionCount || 0
  });
  const modalRef = useRef(null);

  const totalVotes = voteCounts.upvotes + voteCounts.downvotes;
  const upvotePercentage = totalVotes > 0 ? Math.round((voteCounts.upvotes / totalVotes) * 100) : 0;
  const downvotePercentage = totalVotes > 0 ? Math.round((voteCounts.downvotes / totalVotes) * 100) : 0;

  useEffect(() => {
    const checkIfVoted = async () => {
      if (!currentUser) {
        setVoted(false);
        return;
      }

      try {
        // Using a consistent document ID for each user's vote on a protest
        const voteDocId = `${id}_${currentUser.uid}`;
        const voteDocRef = doc(db, 'votes', voteDocId);
        const voteDoc = await getDoc(voteDocRef);
        
        if (voteDoc.exists()) {
          setVoted(true);
          setVoteType(voteDoc.data().vote);
        } else {
          setVoted(false);
          setVoteType(null);
        }
      } catch (error) {
        console.error('Oy kontrol edilirken hata oluştu:', error);
      }
    };

    checkIfVoted();
  }, [currentUser, id]);

  useEffect(() => {
    // Add event listener for ESC key to close modal
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  // Update voteCounts when protest changes
  useEffect(() => {
    setVoteCounts({
      upvotes: protest.supportCount || 0,
      downvotes: protest.oppositionCount || 0
    });
  }, [protest]);

  const handleVote = async (type) => {
    if (!currentUser) {
      toast.error('Oy vermek için giriş yapmalısınız.');
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      const protestRef = doc(db, 'protests', id);
      const protestDoc = await getDoc(protestRef);
      
      if (!protestDoc.exists()) {
        toast.error('Protesto bulunamadı.');
        setLoading(false);
        return;
      }

      // Using a consistent document ID for each user's vote
      const voteDocId = `${id}_${currentUser.uid}`;
      const voteDocRef = doc(db, 'votes', voteDocId);
      const voteDoc = await getDoc(voteDocRef);
      
      // Start a batch write for atomic operations
      const batch = writeBatch(db);
      
      if (voteDoc.exists()) {
        const previousVote = voteDoc.data().vote;
        
        if (previousVote === type) {
          // Same vote type again - removing the vote
          batch.update(protestRef, {
            [type === 'support' ? 'supportCount' : 'oppositionCount']: increment(-1)
          });
          
          // Delete the vote document
          batch.delete(voteDocRef);
          
          setVoted(false);
          setVoteType(null);
          
          // Update local state immediately
          setVoteCounts(prev => ({
            ...prev,
            [type === 'support' ? 'upvotes' : 'downvotes']: prev[type === 'support' ? 'upvotes' : 'downvotes'] - 1
          }));
          
          toast.success('Oyunuz kaldırıldı.');
        } else {
          // Different vote type - changing the vote
          const updates = {};
          
          // Decrement previous vote count
          updates[previousVote === 'support' ? 'supportCount' : 'oppositionCount'] = increment(-1);
          // Increment new vote count
          updates[type === 'support' ? 'supportCount' : 'oppositionCount'] = increment(1);
          
          batch.update(protestRef, updates);
          
          // Update the vote document
          batch.update(voteDocRef, {
            vote: type,
            timestamp: serverTimestamp()
          });
          
          setVoted(true);
          setVoteType(type);
          
          // Update local state immediately
          setVoteCounts(prev => ({
            upvotes: type === 'support' ? prev.upvotes + 1 : prev.upvotes - 1,
            downvotes: type === 'oppose' ? prev.downvotes + 1 : prev.downvotes - 1
          }));
          
          toast.success('Oyunuz güncellendi.');
        }
      } else {
        // First time voting
        // Create vote document
        batch.set(voteDocRef, {
          userId: currentUser.uid,
          protestId: id,
          vote: type,
          timestamp: serverTimestamp()
        });
        
        // Update protest vote count
        batch.update(protestRef, {
          [type === 'support' ? 'supportCount' : 'oppositionCount']: increment(1)
        });
        
        setVoted(true);
        setVoteType(type);
        
        // Update local state immediately
        setVoteCounts(prev => ({
          ...prev,
          [type === 'support' ? 'upvotes' : 'downvotes']: prev[type === 'support' ? 'upvotes' : 'downvotes'] + 1
        }));
        
        toast.success('Oyunuz başarıyla kaydedildi.');
      }
      
      // Commit all changes atomically
      await batch.commit();
      
    } catch (error) {
      console.error('Error voting:', error);
      
      if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
        if (error.message?.includes('already exists')) {
          toast.error('Bu protestoya daha önce oy vermişsiniz.');
          setVoted(true);
        } else {
          toast.error('Oturum süreniz dolmuş olabilir. Lütfen sayfayı yenileyip tekrar deneyin.');
        }
      } else if (error.code === 'unavailable') {
        toast.error('Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.');
      } else {
        toast.error('Oy verme işlemi sırasında bir hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Bilinmeyen tarih';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat('tr-TR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }).format(date);
    } catch (error) {
      console.error('Tarih biçimlendirme hatası:', error);
      return 'Geçersiz tarih';
    }
  };

  const handleReport = async () => {
    if (!currentUser) {
      toast.error('Şikayet göndermek için giriş yapmalısınız.');
      return;
    }

    if (!reportReason.trim()) {
      toast.error('Lütfen bir şikayet nedeni belirtin.');
      return;
    }

    try {
      await addDoc(collection(db, 'reports'), {
        protestId: id,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName,
        protestTitle: title,
        reportReason,
        createdAt: serverTimestamp(),
        status: 'pending'
      });

      toast.success('Şikayetiniz alındı. İnceleme sonrası sizinle iletişime geçilecektir.');
      setShowReportModal(false);
      setReportReason('');
    } catch (error) {
      console.error('Şikayet gönderilirken hata oluştu:', error);
      toast.error('Şikayet gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const openModal = () => {
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setShowModal(false);
    document.body.style.overflow = 'auto';
  };

  const handleOutsideClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      closeModal();
    }
  };

  return (
    <>
      <div className="protest-card">
        <div className="protest-card-inner">
          <div className="protest-card-front">
            <div className="protest-image-container">
              {imageUrl ? (
                <img src={imageUrl} alt={company} className="protest-image" />
              ) : (
                <div className="protest-image-placeholder">
                  <span>{company?.charAt(0) || '?'}</span>
                </div>
              )}
              {category && <span className="protest-badge">{category}</span>}
            </div>
            
            <div className="protest-content">
              <h3 className="protest-title">
                <Link to={`/protest/${id}`}>{title}</Link>
              </h3>
              
              <h4 className="protest-company">{company}</h4>
              
              <p className="protest-description">
                {description.length > 150 ? description.substring(0, 150) + '...' : description}
              </p>
              
              <div className="protest-votes">
                <div className="vote-bars">
                  <div className="vote-results-container">
                    <div className="vote-progress">
                      <div 
                        className="vote-progress-up" 
                        style={{ width: `${upvotePercentage}%` }}
                      ></div>
                      <div 
                        className="vote-progress-down" 
                        style={{ width: `${downvotePercentage}%` }}
                      ></div>
                    </div>
                    <div className="vote-labels">
                      <div className="vote-label">
                        <span className="vote-count" style={{ color: upvotePercentage > 50 ? 'var(--color-success)' : 'inherit' }}>
                          {voteCounts.upvotes}
                        </span>
                        <span className="vote-percent">%{upvotePercentage}</span>
                        <span className="vote-text">Destekleyen</span>
                      </div>
                      <div className="vote-total">
                        {totalVotes} Oy
                      </div>
                      <div className="vote-label">
                        <span className="vote-count" style={{ color: downvotePercentage > 50 ? 'var(--color-danger)' : 'inherit' }}>
                          {voteCounts.downvotes}
                        </span>
                        <span className="vote-percent">%{downvotePercentage}</span>
                        <span className="vote-text">Karşı Çıkan</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {showActions && (
                  <div className="protest-actions">
                    {currentUser ? (
                      <>
                        <button 
                          className={`vote-button upvote ${voteType === 'support' ? 'voted' : ''} ${loading ? 'loading' : ''}`}
                          onClick={() => handleVote('support')}
                          disabled={loading}
                          aria-label="Destekle"
                        >
                          {loading ? (
                            <div className="spinner"></div>
                          ) : (
                            <>
                              <FaThumbsUp size={16} />
                              <span>Destekle</span>
                            </>
                          )}
                        </button>
                        
                        <button 
                          className={`vote-button downvote ${voteType === 'oppose' ? 'voted' : ''} ${loading ? 'loading' : ''}`}
                          onClick={() => handleVote('oppose')}
                          disabled={loading}
                          aria-label="Destekleme"
                        >
                          {loading ? (
                            <div className="spinner"></div>
                          ) : (
                            <>
                              <FaThumbsDown size={16} />
                              <span>Destekleme</span>
                            </>
                          )}
                        </button>
                        
                        <button
                          className="report-button"
                          onClick={() => setShowReportModal(true)}
                          aria-label="Şikayet Et"
                        >
                          <FaFlag size={14} />
                          <span className="sr-only">Şikayet Et</span>
                        </button>
                      </>
                    ) : (
                      <div className="login-required">
                        <FaShieldAlt size={16} className="login-icon" />
                        <span>Oy vermek için giriş yapmalısınız</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="protest-meta">
                <div className="protest-date">
                  <FaCalendarAlt className="meta-icon" />
                  {formatDate(createdAt)}
                </div>
                
                <Link to={`/protest/${id}`} className="read-more">
                  Detayları Gör
                  <FaArrowRight className="meta-icon ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {showReportModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Protestoyu Şikayet Et</h3>
              <button onClick={() => setShowReportModal(false)} className="modal-close">
                <MdClose size={24} />
              </button>
            </div>
            <div className="modal-body">
              <p>Lütfen şikayet nedeninizi belirtin:</p>
              <select 
                className="report-select"
                value={reportReason} 
                onChange={(e) => setReportReason(e.target.value)}
              >
                <option value="">Şikayet sebebi seçin</option>
                <option value="Uygunsuz veya rahatsız edici içerik">Uygunsuz veya rahatsız edici içerik</option>
                <option value="Nefret söylemi veya ayrımcılık">Nefret söylemi veya ayrımcılık</option>
                <option value="Yanlış veya yanıltıcı bilgi">Yanlış veya yanıltıcı bilgi</option>
                <option value="Spam">Spam</option>
                <option value="Diğer">Diğer</option>
              </select>
              
              {reportReason === 'Diğer' && (
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Şikayet nedeninizi detaylı olarak yazın..."
                  rows={4}
                  className="report-textarea"
                />
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowReportModal(false)} className="modal-cancel">
                İptal
              </button>
              <button 
                onClick={handleReport} 
                className="modal-submit"
                disabled={!reportReason}
              >
                Şikayet Gönder
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showModal && (
        <div className="modal-overlay" onClick={handleOutsideClick}>
          <div className="modal-container" ref={modalRef}>
            <div className="modal-header">
              <h2>{title}</h2>
              <button className="modal-close-btn" onClick={closeModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="modal-image-container">
                {imageUrl && (
                  <img 
                    src={imageUrl} 
                    alt={title} 
                    className="modal-image" 
                  />
                )}
              </div>
              
              <div className="modal-info">
                <div className="modal-meta">
                  <div className="modal-date">
                    <FaCalendarAlt className="icon" />
                    <span>{formatDate(createdAt)}</span>
                  </div>
                  <div className="modal-location">{company}</div>
                </div>
                
                <div className="modal-description">
                  <p>{description}</p>
                </div>
                
                {showActions && currentUser && (
                  <div className="modal-actions">
                    <button 
                      className={`vote-btn up-vote ${voteType === 'support' ? 'active' : ''}`} 
                      onClick={() => handleVote('support')}
                      disabled={loading}
                    >
                      <FaThumbsUp className="icon" />
                      <span>Destekle</span>
                    </button>
                    
                    <button 
                      className={`vote-btn down-vote ${voteType === 'oppose' ? 'active' : ''}`} 
                      onClick={() => handleVote('oppose')}
                      disabled={loading}
                    >
                      <FaThumbsDown className="icon" />
                      <span>Karşı Çık</span>
                    </button>
                    
                    <button 
                      className="report-btn"
                      onClick={() => setShowReportModal(true)}
                    >
                      <FaFlag className="icon" />
                      <span>Rapor Et</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <div className="modal-vote-container">
                <div className="vote-bar-container">
                  <div className="vote-bar">
                    <div 
                      className="vote-bar-progress" 
                      style={{ width: `${upvotePercentage}%` }}
                    ></div>
                  </div>
                  <div className="vote-count">
                    <span className="up-votes">{voteCounts.upvotes}</span>
                    <span className="separator">/</span>
                    <span className="down-votes">{voteCounts.downvotes}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Protest; 