import express from "express"
import {createFormMorning,checkMorningSubmission, getLastSevenDaysArraysMorning,
    createFormNight,checkNightSubmission, getLastSevenDaysArraysNight, 
    generateAndSaveAISummary, getTodaysAISummary}
    from "../controllers/dailyFormController.js"

const router = express.Router()

// Morning

router.post('/morning', createFormMorning)

router.get('/morning/check', checkMorningSubmission);

router.get('/morning/last_seven', getLastSevenDaysArraysMorning);

// Night

router.post('/night', createFormNight)

router.get('/night/check', checkNightSubmission);

router.get('/night/last_seven', getLastSevenDaysArraysNight);

// AI Summary

router.post('/ai/analyze', generateAndSaveAISummary);

router.get("/ai/summary/today", getTodaysAISummary);


export default router;