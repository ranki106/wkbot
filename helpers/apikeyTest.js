const fetch = require('node-fetch');

async function isApiKeyValid(apiKey) {
    try {
        const response = await fetch('https://api.wanikani.com/v2/user', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        if (!response.ok) {
            return false
        }

        return response.ok
    } catch (err) {
        return false
    }
}

module.exports = { isApiKeyValid };
