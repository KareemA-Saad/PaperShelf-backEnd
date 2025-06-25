const fs = require('fs');
const path = require('path');

const logger = (req, res, next) => {
    // Create log entry
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.url;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Log to console
    console.log(`📝 ${timestamp} | ${method} ${url} | IP: ${ip}`);

    // Log to file (optional)
    const logEntry = `${timestamp} | ${method} ${url} | IP: ${ip} | User-Agent: ${userAgent}\n`;

    // Create logs directory if it doesn't exist
    const logsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir);
    }

    // Write to log file
    fs.appendFileSync(
        path.join(logsDir, 'requests.log'),
        logEntry
    );

    next();
};

module.exports = logger; 