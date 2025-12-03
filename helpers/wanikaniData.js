const fetch = require('node-fetch');

async function getWaniKaniData(apiKey) {
    if (!apiKey) {
        throw new Error('API key is required');
    }

    const userRes = await fetch('https://api.wanikani.com/v2/user', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    if (!userRes.ok) {
        const text = await userRes.text();
        console.error('waniKani API error response:', userRes.status, text);
        return interaction.reply({ content: 'Failed to fetch data from WaniKani API. Please ensure your API key is valid.', ephemeral: true });
    }

    const userData = await userRes.json();
    const assignmentsRes = await fetch('https://api.wanikani.com/v2/summary', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (!assignmentsRes.ok) {
        const text = await assignmentsRes.text();
        console.error('waniKani API error response:', assignmentsRes.status, text);
        return interaction.reply({ content: 'Failed to fetch assignments from WaniKani API. Please ensure your API key is valid.', ephemeral: true });
    }

    const assignmentsData = await assignmentsRes.json();

    const pendingLessons = assignmentsData.data.lessons[0].subject_ids.length

    const now = new Date()

    const dueRightNow = assignmentsData.data.reviews
        .filter(review => new Date(review.available_at) <= now)
        .reduce((acc, review) => acc + review.subject_ids.length, 0)
        
    const dueNext24Hours = assignmentsData.data.reviews
        .reduce((acc, review) => acc + review.subject_ids.length, 0)
        
    return {
        userData: userData.data,
        dueNext24Hours,
        dueRightNow,
        pendingLessons
    }
}

module.exports = { getWaniKaniData }