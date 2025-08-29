import {sql} from "../config/db.js"

function toScore(value, fieldName) {
  if (value === undefined || value === null) {
    throw new Error(`Missing ${fieldName}`);
  }

  // already numeric?
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isNaN(n) && n >= 1 && n <= 3) return n;

  const map = { bad: 1, neutral: 2, top: 3 };
  const s = String(value).trim().toLowerCase();
  // strip optional prefixes like "mood-", "lift-", "chess-"
  const suffix = s.replace(/^(mood|lift|chess|endurance)-/, '');
  if (suffix in map) return map[suffix];

  throw new Error(
    `${fieldName} must be one of: 1, 2, 3 or *-bad | *-neutral | *-top (got "${value}")`
  );
}

export async function createFormMorning(req,res) {
    try {

        const {sleep, motivation, objective_1, objective_2, user_id} = req.body

        if(!sleep || !motivation || !objective_1 || !objective_2) {
            return res.status(404).json({message: "All fields are required."})
        }

        console.log(sleep, motivation, objective_1, objective_2)

        const form = await sql`
            INSERT INTO morningForms(user_id, sleep, motivation, objective_1, objective_2)
            VALUES (${user_id},${sleep},${motivation},${objective_1},${objective_2})
            RETURNING *
        `
        console.log(form)
        res.status(201).json(form[0])

    } catch (error) {
        console.log('Error creating the form :',error)
        res.status(500).json({message:'Internal server error'})
    }
}

export async function checkMorningSubmission(req, res) {
  try {

    const { user_id } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ message: 'Missing required parameter: user_id' });
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    const existingRecord = await sql`
      SELECT id, sleep, motivation, objective_1, objective_2, created_at
      FROM morningForms 
      WHERE user_id = ${user_id} 
      AND DATE(created_at) = ${today}
      LIMIT 1
    `;

    console.log('Check result for today:', existingRecord);

    if (existingRecord.length > 0) {
      res.json({alreadySubmitted: true,date: today,user_id: user_id});
    } else {
      res.json({alreadySubmitted: false,date: today,user_id: user_id});
    }

  } catch (error) {
    console.log('Error checking daily form submission:', error);
    res.status(500).json({ 
      message: 'Internal server error while checking submission' 
    });
  }
}

export async function getLastSevenDaysArraysMorning(req, res) {
  try {
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ 
        message: 'Missing required parameter: user_id' 
      });
    }

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);

    const todayStr = today.toISOString().split('T')[0];
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const records = await sql`
      SELECT 
        created_at,
        sleep, 
        motivation, 
        objective_1, 
        objective_2
      FROM morningForms 
      WHERE user_id = ${user_id} 
      AND created_at >= ${sevenDaysAgoStr}
      AND created_at <= ${todayStr + ' 23:59:59'}
      ORDER BY created_at ASC
    `;

    const sleepArray = [];
    const motivationArray = [];
    const objective_1Array = [];
    const objective_2Array = [];
    const labels = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
      
      const recordForDay = records.find(record => {

        const timezoneOffset = new Date().getTimezoneOffset() / 60;
        
        const dbDate = new Date(record.created_at);
        dbDate.setHours(dbDate.getHours() - timezoneOffset);
        const dbDateStr = dbDate.toISOString().split('T')[0];
        return dbDateStr === dateStr;
      });
      
      labels.push(dayName);
      
      if (recordForDay) {
        sleepArray.push(recordForDay.sleep);
        motivationArray.push(recordForDay.motivation);
        objective_1Array.push(recordForDay.objective_1);
        objective_2Array.push(recordForDay.objective_2);
      } else {
        sleepArray.push(0);
        motivationArray.push(0);
        objective_1Array.push(0);
        objective_2Array.push(0);
      }
    }

    console.log('Processed chart data:', { sleepArray, motivationArray, objective_1Array, objective_2Array });

    res.json({
      success: true,
      user_id: user_id,
      labels: labels,
      chartData: {
        sleep: sleepArray,
        motivation: motivationArray,
        objective_1: objective_1Array,
        objective_2: objective_2Array
      }
    });

  } catch (error) {
    console.log('Error fetching chart data:', error);
    res.status(500).json({ 
      message: 'Internal server error while fetching chart data' 
    });
  }
}


export async function createFormNight(req,res) {
    try {

        const {mood, lift, endurance, chess, user_id} = req.body

        if(!mood || !lift || !endurance || !chess) {
            return res.status(404).json({message: "All fields are required."})
        }

        console.log(mood, lift, endurance, chess)

        const moodScore = toScore(mood, 'mood');
        const liftScore = toScore(lift, 'lift');
        const enduranceScore = toScore(endurance, 'endurance');
        const chessScore = toScore(chess, 'chess');

        console.log(moodScore, liftScore, enduranceScore, chessScore)

        const form = await sql`
            INSERT INTO nightForms(user_id, mood, lift, endurance, chess)
            VALUES (${user_id},${moodScore},${liftScore},${enduranceScore},${chessScore})
            RETURNING *
        `
        console.log(form)
        res.status(201).json(form[0])

    } catch (error) {
        console.log('Error creating the form :',error)
        res.status(500).json({message:'Internal server error'})
    }
}

export async function checkNightSubmission(req, res) {
  try {

    const { user_id } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ message: 'Missing required parameter: user_id' });
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    const existingRecord = await sql`
      SELECT id, mood, lift, endurance, created_at
      FROM nightForms 
      WHERE user_id = ${user_id} 
      AND DATE(created_at) = ${today}
      LIMIT 1
    `;

    console.log('Check result for today:', existingRecord);

    if (existingRecord.length > 0) {
      res.json({alreadySubmitted: true,date: today,user_id: user_id});
    } else {
      res.json({alreadySubmitted: false,date: today,user_id: user_id});
    }

  } catch (error) {
    console.log('Error checking daily form submission:', error);
    res.status(500).json({ 
      message: 'Internal server error while checking submission' 
    });
  }
}

export async function getLastSevenDaysArraysNight(req, res) {
  try {
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ 
        message: 'Missing required parameter: user_id' 
      });
    }

    // Calculate date range
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);

    const todayStr = today.toISOString().split('T')[0];
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    // Query database - Fix timezone handling in SQL
    const records = await sql`
      SELECT 
        created_at,
        mood,
        lift,
        endurance,
        chess
      FROM nightForms 
      WHERE user_id = ${user_id} 
      AND created_at >= ${sevenDaysAgoStr}
      AND created_at <= ${todayStr + ' 23:59:59'}
      ORDER BY created_at ASC
    `;

    // Create arrays for the last 7 days
    const moodArray = [];
    const liftArray = [];
    const enduranceArray = [];
    const chessArray = [];
    const labels = [];

    // Fill arrays with data for each of the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
      
      // Find record for this date - Auto-detect timezone offset
      const recordForDay = records.find(record => {
        // Get the timezone offset in hours (e.g., -2 for UTC+2)
        const timezoneOffset = new Date().getTimezoneOffset() / 60;
        
        // Create a date from the database timestamp and adjust for local timezone
        const dbDate = new Date(record.created_at);
        dbDate.setHours(dbDate.getHours() - timezoneOffset);
        const dbDateStr = dbDate.toISOString().split('T')[0];
        
        return dbDateStr === dateStr;
      });
      
      labels.push(dayName);
      
      if (recordForDay) {
        moodArray.push(recordForDay.mood);
        liftArray.push(recordForDay.lift);
        enduranceArray.push(recordForDay.endurance);
        chessArray.push(recordForDay.chess);
      } else {
        moodArray.push(0);
        liftArray.push(0);
        enduranceArray.push(0);
        chessArray.push(0);
      }
    }

    console.log('Processed chart data:', { moodArray, liftArray, enduranceArray, labels });

    res.json({
      success: true,
      user_id: user_id,
      labels: labels,
      chartData: {
        mood: moodArray,
        lift: liftArray,
        endurance: enduranceArray,
        chess: chessArray
      }
    });

  } catch (error) {
    console.log('Error fetching chart data:', error);
    res.status(500).json({ 
      message: 'Internal server error while fetching chart data' 
    });
  }
}

export async function getAIsummary(req, res) {
  try {
    const { user_id, data } = req.body;

    if (!user_id || !data) {
      return res.status(400).json({
        success: false,
        message: 'user_id and data are required'
      });
    }

    // data ressemble à { sleep:[...], motivation:[...], mood:[...], lift:[...], endurance:[...], chess:[...] }

    const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;

    const averages = {
      sleep: avg(data.sleep.filter(v => v>0)),
      motivation: avg(data.motivation.filter(v => v>0)),
      mood: avg(data.mood.filter(v => v>0)),
      lift: avg(data.lift.filter(v => v>0)),
      endurance: avg(data.endurance.filter(v => v>0)),
      chess: avg(data.chess.filter(v => v>0)),
    };

    const prompt = `
    HEALTH TRACKING ANALYSIS for ${user_id} (last 7 days)

    QUESTIONS PART 1 (Scale = 0-10):
    - Sleep: ${data.sleep.join(', ')} (Avg: ${averages.sleep.toFixed(1)})
    - Motivation: ${data.motivation.join(', ')} (Avg: ${averages.motivation.toFixed(1)})

    QUESTIONS PART 2 (Scale = 1-3):
    - Mood: ${data.mood.join(', ')} (Avg: ${averages.mood.toFixed(1)})
    - Lift: ${data.lift.join(', ')} (Avg: ${averages.lift.toFixed(1)})
    - Endurance: ${data.endurance.join(', ')} (Avg: ${averages.endurance.toFixed(1)})
    - Chess: ${data.chess.join(', ')} (Avg: ${averages.chess.toFixed(1)})

    TASK: Provide:
    1. Key observations
    2. Trends & correlations
    3. Strengths & risks
    4. 3 concrete recommendations
    Keep it <150 words, supportive, practical. Returns it in French !
    `;

    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }]}]
      })
    });

    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Gemini API error: ${resp.status} ${body}`);
    }

    const json = await resp.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    return res.json({
      success: true,
      analysis: text.trim(),
      averages
    });

  } catch (err) {
    console.error('getAIsummary error:', err);
    return res.status(500).json({
      success: false,
      message: 'Unable to generate AI analysis',
      error: process.env.NODE_ENV === 'development' ? String(err) : undefined
    });
  }
}


// petit fallback simple, réutilisable
function simpleFallbackSummary(averages, morningCount, nightCount) {
  const lines = [];
  lines.push(`Semaine synthèse (fallback):`);
  lines.push(`• Sommeil moyen: ${averages.sleep.toFixed(1)}/10 | Motivation: ${averages.motivation.toFixed(1)}/10`);
  lines.push(`• Soir: Humeur ${averages.mood.toFixed(1)}, Force ${averages.lift.toFixed(1)}, Endurance ${averages.endurance.toFixed(1)}, Échecs ${averages.chess.toFixed(1)} (échelle 1-3)`);
  lines.push(`• Couverture: matin ${morningCount}/7, soir ${nightCount}/7`);
  lines.push(`• Actions: 1) heure de coucher fixe 2) 2 séances d’endurance modérée 3) 1 séance force + mobilité 4) routine “shutdown” 15 min avant dodo.`);
  return lines.join('\n');
}


