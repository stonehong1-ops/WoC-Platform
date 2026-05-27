const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\stone\\.gemini\\antigravity\\brain';
const targetSessions = [
    '4c574988-4477-4704-a177-37b49037fa90',
    '4b3ddb43-6df7-4cf0-b25b-7c715ccd1c0b'
];

let finalOutput = [];

targetSessions.forEach(session => {
    const logPath = path.join(brainDir, session, '.system_generated', 'logs', 'overview.txt');
    if (!fs.existsSync(logPath)) {
        console.log(`Session ${session} log not found.`);
        return;
    }
    
    const content = fs.readFileSync(logPath, 'utf8');
    const lines = content.split('\n');
    let items = [];
    
    for (const line of lines) {
        if (!line.trim()) continue;
        try {
            const parsed = JSON.parse(line);
            if (parsed.type === 'USER_INPUT' && parsed.content) {
                items.push({
                    type: 'USER',
                    time: parsed.created_at,
                    content: parsed.content
                });
            } else if (parsed.type === 'PLANNER_RESPONSE' && parsed.content) {
                items.push({
                    type: 'MODEL',
                    time: parsed.created_at,
                    content: parsed.content
                });
            }
        } catch (e) {}
    }
    
    // Group into turns
    let turns = [];
    let currentTurn = null;
    
    for (const item of items) {
        if (item.type === 'USER') {
            if (currentTurn) turns.push(currentTurn);
            currentTurn = { user: item, models: [] };
        } else if (item.type === 'MODEL') {
            if (currentTurn) currentTurn.models.push(item);
        }
    }
    if (currentTurn) turns.push(currentTurn);
    
    finalOutput.push({ session, turns });
});

fs.writeFileSync('C:\\Users\\stone\\WoC\\all_user_requests.json', JSON.stringify(finalOutput, null, 2), 'utf8');

// Also write a readable text file
let text = [];
finalOutput.forEach(s => {
    text.push(`========================================================================`);
    text.push(`SESSION ID: ${s.session}`);
    text.push(`========================================================================\n`);
    s.turns.forEach((t, i) => {
        text.push(`### [Turn ${i + 1}] Time: ${t.user.time}`);
        text.push(`👤 USER REQUEST:`);
        text.push(t.user.content);
        text.push(`\n🤖 MODEL RESPONSES:`);
        t.models.forEach((m, mi) => {
            text.push(`--- [Reply ${mi + 1}] Time: ${m.time}`);
            text.push(m.content);
        });
        text.push(`\n------------------------------------------------------------------------\n`);
    });
});

fs.writeFileSync('C:\\Users\\stone\\WoC\\current_state.txt', text.join('\n'), 'utf8');
console.log('Success extracting both sessions!');
