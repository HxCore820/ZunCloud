// Global Variables
let currentUser = null;
let userPoints = 0;
let adWatched = false;

// Check Authentication State
window.addEventListener('load', () => {
    if (window.firebaseOnAuthStateChanged) {
        window.firebaseOnAuthStateChanged(window.firebaseAuth, async (user) => {
            if (user) {
                currentUser = user;
                await loadUserData(user);
                showUserProfile(user);
            } else {
                currentUser = null;
                showLoginForm();
            }
        });
    }
});

// Google Login
async function googleLogin() {
    try {
        const result = await window.firebaseSignInWithPopup(window.firebaseAuth, window.googleProvider);
        const user = result.user;
        
        // Check if new user (first time login)
        const userDoc = await window.firestoreGetDoc(window.firestoreDoc(window.firebaseDb, 'users', user.uid));
        
        if (!userDoc.exists()) {
            // New user - give 300 bonus points
            await window.firestoreSetDoc(window.firestoreDoc(window.firebaseDb, 'users', user.uid), {
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                points: 300,
                createdAt: new Date(),
                lastLogin: new Date(),
                totalEarned: 300,
                vpsCreated: 0
            });
            
            userPoints = 300;
            showNotification('🎉 Welcome! You received 300 bonus points!', 'success');
        } else {
            // Existing user - update last login
            await window.firestoreUpdateDoc(window.firestoreDoc(window.firebaseDb, 'users', user.uid), {
                lastLogin: new Date()
            });
            
            const userData = userDoc.data();
            userPoints = userData.points || 0;
        }
        
        updatePointsDisplay();
        showUserProfile(user);
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed. Please try again.', 'error');
    }
}

// GitHub Login (placeholder)
function githubLogin() {
    showNotification('GitHub login coming soon!', 'info');
}

// Microsoft Login (placeholder)
function microsoftLogin() {
    showNotification('Microsoft login coming soon!', 'info');
}

// Load User Data
async function loadUserData(user) {
    try {
        const userDoc = await window.firestoreGetDoc(window.firestoreDoc(window.firebaseDb, 'users', user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            userPoints = userData.points || 0;
            updatePointsDisplay();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Show User Profile
function showUserProfile(user) {
    document.getElementById('loginCard').style.display = 'none';
    document.getElementById('userProfile').style.display = 'block';
    
    document.getElementById('userName').textContent = user.displayName;
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('userAvatar').src = user.photoURL || 'https://via.placeholder.com/60';
}

// Show Login Form
function showLoginForm() {
    document.getElementById('loginCard').style.display = 'block';
    document.getElementById('userProfile').style.display = 'none';
}

// Logout
async function logout() {
    try {
        await window.firebaseSignOut(window.firebaseAuth);
        currentUser = null;
        userPoints = 0;
        updatePointsDisplay();
        showLoginForm();
        showNotification('Logged out successfully!', 'success');
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Update Points Display
function updatePointsDisplay() {
    document.getElementById('userPoints').textContent = userPoints.toLocaleString();
    const progressPercent = Math.min((userPoints / 1000) * 100, 100);
    document.getElementById('progressBar').style.width = progressPercent + '%';
}

// Add Points to User
async function addPoints(amount) {
    if (!currentUser) {
        showNotification('Please login first!', 'warning');
        return;
    }
    
    try {
        await window.firestoreUpdateDoc(window.firestoreDoc(window.firebaseDb, 'users', currentUser.uid), {
            points: window.firestoreIncrement(amount),
            totalEarned: window.firestoreIncrement(amount)
        });
        
        userPoints += amount;
        updatePointsDisplay();
        showNotification(`+${amount} points earned!`, 'success');
    } catch (error) {
        console.error('Error adding points:', error);
        showNotification('Failed to add points', 'error');
    }
}

// Show Ad Reward Modal
function showAdReward() {
    if (!currentUser) {
        showNotification('Please login first to earn points!', 'warning');
        showLoginModal();
        return;
    }
    document.getElementById('adModal').style.display = 'block';
    startAdTimer();
}

// Close Ad Modal
function closeAdModal() {
    document.getElementById('adModal').style.display = 'none';
    adWatched = false;
    document.getElementById('claimReward').disabled = true;
}

// Start Ad Timer
function startAdTimer() {
    let timeLeft = 30;
    const timerElement = document.getElementById('adTimer');
    const claimButton = document.getElementById('claimReward');
    
    const timer = setInterval(() => {
        timeLeft--;
        timerElement.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            adWatched = true;
            claimButton.disabled = false;
            showNotification('Ad completed! Claim your reward!', 'success');
        }
    }, 1000);
}

// Claim Ad Reward
async function claimAdReward() {
    if (adWatched) {
        await addPoints(20);
        closeAdModal();
    }
}

// Watch Video Ad
function watchVideoAd() {
    showAdReward();
}

// Complete Short Link
async function completeShortLink() {
    if (!currentUser) {
        showNotification('Please login first!', 'warning');
        return;
    }
    
    // Simulate short link completion
    showNotification('Completing short link...', 'info');
    setTimeout(async () => {
        await addPoints(20);
    }, 2000);
}

// Daily Bonus
async function dailyBonus() {
    if (!currentUser) {
        showNotification('Please login first!', 'warning');
        return;
    }
    
    // Check if user already claimed today
    const userDoc = await window.firestoreGetDoc(window.firestoreDoc(window.firebaseDb, 'users', currentUser.uid));
    const userData = userDoc.data();
    const lastClaim = userData.lastDailyBonus ? userData.lastDailyBonus.toDate() : null;
    const today = new Date();
    
    if (lastClaim && lastClaim.toDateString() === today.toDateString()) {
        showNotification('Daily bonus already claimed today!', 'warning');
        return;
    }
    
    await window.firestoreUpdateDoc(window.firestoreDoc(window.firebaseDb, 'users', currentUser.uid), {
        lastDailyBonus: new Date()
    });
    
    await addPoints(20);
}

// Special Mission
async function specialMission() {
    if (!currentUser) {
        showNotification('Please login first!', 'warning');
        return;
    }
    
    showNotification('Special mission completed!', 'success');
    await addPoints(20);
}

// Show Login Modal
function showLoginModal() {
    window.scrollTo({ top: document.getElementById('loginCard').offsetTop - 100, behavior: 'smooth' });
}

// Show Register Modal
function showRegisterModal() {
    showNotification('Please use Google Sign-in to register!', 'info');
}

// Redeem VPS
function redeemVPS() {
    if (!currentUser) {
        showNotification('Please login first!', 'warning');
        return;
    }
    
    if (userPoints < 1000) {
        showNotification(`You need ${1000 - userPoints} more points to redeem VPS!`, 'warning');
        return;
    }
    
    document.getElementById('vpsModal').style.display = 'block';
}

// Close VPS Modal
function closeVpsModal() {
    document.getElementById('vpsModal').style.display = 'none';
    document.getElementById('vpsResult').style.display = 'none';
    document.querySelector('.vps-form').style.display = 'block';
}

// Create VPS using GitHub Actions
async function createVPS() {
    if (!currentUser) {
        showNotification('Please login first!', 'warning');
        return;
    }
    
    if (userPoints < 1000) {
        showNotification('Insufficient points!', 'error');
        return;
    }
    
    const osVersion = document.getElementById('osVersion').value;
    const language = document.getElementById('language').value;
    
    // Show loading
    showNotification('Creating your VPS... Please wait...', 'info');
    
    try {
        // Deduct points first
        await window.firestoreUpdateDoc(window.firestoreDoc(window.firebaseDb, 'users', currentUser.uid), {
            points: window.firestoreIncrement(-1000),
            vpsCreated: window.firestoreIncrement(1)
        });
        
        userPoints -= 1000;
        updatePointsDisplay();
        
        // QUAN TRỌNG: Thay YOUR_GITHUB_USERNAME và YOUR_REPO_NAME
        // Trigger GitHub Actions workflow
        const githubToken = 'YOUR_GITHUB_TOKEN'; // Cần tạo Personal Access Token
        const owner = 'YOUR_GITHUB_USERNAME';
        const repo = 'YOUR_REPO_NAME';
        const workflow_id = 'WindowsRDP.yml';
        
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow_id}/dispatches`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ref: 'main',
                inputs: {
                    os_version: osVersion,
                    language: language
                }
            })
        });
        
        if (response.ok) {
            // Save VPS creation to Firestore
            const vpsId = Date.now().toString();
            await window.firestoreSetDoc(window.firestoreDoc(window.firebaseDb, 'vps', vpsId), {
                userId: currentUser.uid,
                osVersion: osVersion,
                language: language,
                createdAt: new Date(),
                status: 'creating',
                expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000) // 6 hours
            });
            
            // Simulate getting IPs (in real scenario, you'd poll GitHub Actions for the actual IPs)
            setTimeout(() => {
                const rdpIP = '123.45.67.89:3389';
                const webURL = 'http://123.45.67.89:8006';
                
                document.getElementById('rdpIP').textContent = rdpIP;
                document.getElementById('webURL').textContent = webURL;
                document.getElementById('webURL').href = webURL;
                
                document.querySelector('.vps-form').style.display = 'none';
                document.getElementById('vpsResult').style.display = 'block';
                
                showNotification('VPS created successfully!', 'success');
            }, 3000);
        } else {
            throw new Error('Failed to trigger GitHub workflow');
        }
        
    } catch (error) {
        console.error('VPS creation error:', error);
        showNotification('Failed to create VPS. Points refunded.', 'error');
        
        // Refund points
        await window.firestoreUpdateDoc(window.firestoreDoc(window.firebaseDb, 'users', currentUser.uid), {
            points: window.firestoreIncrement(1000)
        });
        userPoints += 1000;
        updatePointsDisplay();
    }
}

// Copy RDP Info
function copyRDP() {
    const rdpIP = document.getElementById('rdpIP').textContent;
    const rdpInfo = `
RDP Connection Info:
IP: ${rdpIP}
Username: Admin
Password: Window@123456
    `.trim();
    
    navigator.clipboard.writeText(rdpInfo).then(() => {
        showNotification('RDP info copied to clipboard!', 'success');
    });
}

// Show Notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : type === 'warning' ? '#F59E0B' : '#3B82F6'};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Email/Password Login
document.getElementById('loginForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    showNotification('Please use Google Sign-in for now!', 'info');
});

// Close modals when clicking outside
window.onclick = function(event) {
    const adModal = document.getElementById('adModal');
    const vpsModal = document.getElementById('vpsModal');
    
    if (event.target === adModal) {
        closeAdModal();
    }
    if (event.target === vpsModal) {
        closeVpsModal();
    }
}

// Make functions global
window.googleLogin = googleLogin;
window.githubLogin = githubLogin;
window.microsoftLogin = microsoftLogin;
window.logout = logout;
window.showAdReward = showAdReward;
window.closeAdModal = closeAdModal;
window.claimAdReward = claimAdReward;
window.watchVideoAd = watchVideoAd;
window.completeShortLink = completeShortLink;
window.dailyBonus = dailyBonus;
window.specialMission = specialMission;
window.showLoginModal = showLoginModal;
window.showRegisterModal = showRegisterModal;
window.redeemVPS = redeemVPS;
window.closeVpsModal = closeVpsModal;
window.createVPS = createVPS;
window.copyRDP = copyRDP;
