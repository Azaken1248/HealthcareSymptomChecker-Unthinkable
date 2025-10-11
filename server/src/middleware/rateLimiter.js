import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, 
	max: 100, 
	standardHeaders: true, 
	legacyHeaders: false,
    message: {
        status: 429,
        message: "Too many requests from this IP, please try again after 15 minutes."
    }
});

export default apiLimiter;