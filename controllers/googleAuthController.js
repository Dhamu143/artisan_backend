const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const mockDB = {
    users: [],
    findUserByEmail: async (email) => {
        return mockDB.users.find(u => u.email === email);
    },
    createUser: async (userData) => {
        const newUser = { id: Date.now(), ...userData };
        mockDB.users.push(newUser);
        return newUser;
    }
};

const googleLogin = async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ message: 'Google token is required' });
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        
        const { email, name, picture, sub: googleId } = payload;

        let user = await mockDB.findUserByEmail(email);

        if (!user) {
            user = await mockDB.createUser({
                email,
                name,
                picture,
                googleId,
                provider: 'google'
            });
            console.log('New user created:', user.email);
        } else {
            console.log('Existing user logged in:', user.email);
        }

        const appToken = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        res.status(200).json({
            success: true,
            token: appToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                picture: user.picture
            }
        });

    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = { googleLogin };
