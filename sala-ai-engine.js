const AI_CONFIG = {
  irt: {
    initialAbility: 0,
    discriminationRange: [0.5, 2.5],
    difficultyRange: [-3, 3],
    guessingFactor: 0.25,
  },
  
  bkt: {
    pInit: 0.1,
    pLearn: 0.3,
    pSlip: 0.1,
    pGuess: 0.25,
  },
  
  spacedRepetition: {
    minInterval: 1,
    easyBonus: 1.3,
    intervalModifier: 1.0,
  },
  
  // Adaptive thresholds
  adaptive: {
    increaseThreshold: 0.8,  
    decreaseThreshold: 0.4,  
    windowSize: 3,
  }
};

// ITEM RESPONSE THEORY (IRT) ENGINE
class IRTEngine {
  constructor() {
    this.studentAbilities = {};
  }

  /**
   * Calculate probability of correct answer using 3PL IRT model
   * P(θ) = c + (1-c) / (1 + exp(-a(θ - b)))
*/
  probabilityCorrect(theta, a, b, c = AI_CONFIG.irt.guessingFactor) {
    return c + (1 - c) / (1 + Math.exp(-a * (theta - b)));
  }

  updateAbility(studentId, subject, correct, itemDifficulty, itemDiscrimination) {
    const key = `${studentId}_${subject}`;
    const currentTheta = this.studentAbilities[key] || AI_CONFIG.irt.initialAbility;
    
    // Calculate expected probability
    const expectedP = this.probabilityCorrect(
      currentTheta, 
      itemDiscrimination, 
      itemDifficulty
    );
    
    // Update using gradient ascent
    const learningRate = 0.1;
    const error = (correct ? 1 : 0) - expectedP;
    const gradient = itemDiscrimination * error;
    
    const newTheta = currentTheta + learningRate * gradient;
    this.studentAbilities[key] = Math.max(-3, Math.min(3, newTheta)); // Clamp to [-3, 3]
    
    return this.studentAbilities[key];
  }

  getAbility(studentId, subject) {
    const key = `${studentId}_${subject}`;
    return this.studentAbilities[key] || AI_CONFIG.irt.initialAbility;
  }

  selectNextQuestion(studentId, subject, availableQuestions) {
    const theta = this.getAbility(studentId, subject);
    
    // Calculate information for each question
    const questionsWithInfo = availableQuestions.map(q => {
      const info = this.itemInformation(theta, q.discrimination, q.difficulty);
      return { ...q, information: info };
    });
    
    // Sort by information (higher is better)
    questionsWithInfo.sort((a, b) => b.information - a.information);
    
    return questionsWithInfo[0];
  }

  itemInformation(theta, a, b) {
    const p = this.probabilityCorrect(theta, a, b);
    const q = 1 - p;
    return a * a * q * p / (1 - AI_CONFIG.irt.guessingFactor);
  }

  save() {
    localStorage.setItem('sala_irt_state', JSON.stringify(this.studentAbilities));
  }

  load() {
    try {
      const saved = localStorage.getItem('sala_irt_state');
      if (saved) {
        this.studentAbilities = JSON.parse(saved);
      }
    } catch (error) {
      console.error('IRT load error:', error);
    }
  }
}

// BAYESIAN KNOWLEDGE TRACING (BKT)
class BayesianKnowledgeTracer {
  constructor() {
    this.knowledgeStates = {}; // P(L) for each student-skill pair
  }

  initSkill(studentId, skillId) {
    const key = `${studentId}_${skillId}`;
    if (!(key in this.knowledgeStates)) {
      this.knowledgeStates[key] = AI_CONFIG.bkt.pInit;
    }
    return this.knowledgeStates[key];
  }

  update(studentId, skillId, correct) {
    const key = `${studentId}_${skillId}`;
    let pL = this.knowledgeStates[key] || AI_CONFIG.bkt.pInit;
    
    const { pLearn, pSlip, pGuess } = AI_CONFIG.bkt;
    
    if (correct) {
      // P(L|correct) using Bayes rule
      const pCorrectGivenL = 1 - pSlip;
      const pCorrectGivenNotL = pGuess;
      const pCorrect = pL * pCorrectGivenL + (1 - pL) * pCorrectGivenNotL;
      
      pL = (pL * pCorrectGivenL) / pCorrect;
    } else {
      // P(L|incorrect)
      const pIncorrectGivenL = pSlip;
      const pIncorrectGivenNotL = 1 - pGuess;
      const pIncorrect = pL * pIncorrectGivenL + (1 - pL) * pIncorrectGivenNotL;
      
      pL = (pL * pIncorrectGivenL) / pIncorrect;
    }
    
    // Apply learning probability
    pL = pL + (1 - pL) * pLearn;
    
    this.knowledgeStates[key] = Math.max(0, Math.min(1, pL));
    return this.knowledgeStates[key];
  }

 getMastery(studentId, skillId) {
    const key = `${studentId}_${skillId}`;
    return this.knowledgeStates[key] || AI_CONFIG.bkt.pInit;
  }

  getWeakSkills(studentId, skillIds) {
    return skillIds
      .map(skillId => ({
        skillId,
        mastery: this.getMastery(studentId, skillId)
      }))
      .filter(skill => skill.mastery < 0.7)
      .sort((a, b) => a.mastery - b.mastery);
  }

  save() {
    localStorage.setItem('sala_bkt_state', JSON.stringify(this.knowledgeStates));
  }

  load() {
    try {
      const saved = localStorage.getItem('sala_bkt_state');
      if (saved) {
        this.knowledgeStates = JSON.parse(saved);
      }
    } catch (error) {
      console.error('BKT load error:', error);
    }
  }
}

// SPACED REPETITION (SM-2 ALGORITHM)
class SpacedRepetitionScheduler {
  constructor() {
    this.cards = {}; // Review schedule for each concept
  }

  initCard(studentId, conceptId) {
    const key = `${studentId}_${conceptId}`;
    if (!(key in this.cards)) {
      this.cards[key] = {
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        lastReview: null,
        nextReview: new Date(),
      };
    }
    return this.cards[key];
  }

  review(studentId, conceptId, quality) {
    const key = `${studentId}_${conceptId}`;
    const card = this.cards[key] || this.initCard(studentId, conceptId);
    
    card.easeFactor = Math.max(1.3, 
      card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );
    
    if (quality < 3) {
      card.repetitions = 0;
      card.interval = 1;
    } else {
      card.repetitions += 1;
      
      if (card.repetitions === 1) {
        card.interval = 1;
      } else if (card.repetitions === 2) {
        card.interval = 6;
      } else {
        card.interval = Math.round(card.interval * card.easeFactor);
      }
    }
    
    card.lastReview = new Date();
    card.nextReview = new Date(Date.now() + card.interval * 24 * 60 * 60 * 1000);
    
    this.cards[key] = card;
    return card;
  }

  // Get concepts due for review
 getDueCards(studentId, conceptIds) {
    const now = new Date();
    return conceptIds
      .map(conceptId => {
        const key = `${studentId}_${conceptId}`;
        const card = this.cards[key] || this.initCard(studentId, conceptId);
        return { conceptId, card, due: card.nextReview <= now };
      })
      .filter(item => item.due)
      .sort((a, b) => a.card.nextReview - b.card.nextReview);
  }

  save() {
    localStorage.setItem('sala_sr_state', JSON.stringify(this.cards));
  }

  load() {
    try {
      const saved = localStorage.getItem('sala_sr_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        for (const key in parsed) {
          parsed[key].lastReview = parsed[key].lastReview ? new Date(parsed[key].lastReview) : null;
          parsed[key].nextReview = new Date(parsed[key].nextReview);
        }
        this.cards = parsed;
      }
    } catch (error) {
      console.error('SR load error:', error);
    }
  }
}

// COLLABORATIVE FILTERING
class CollaborativeFilter {
  findSimilarStudents(targetStudentId, allStudentsData, topN = 5) {
    const targetVector = this.getPerformanceVector(targetStudentId, allStudentsData);
    
    const similarities = allStudentsData
      .filter(student => student.id !== targetStudentId)
      .map(student => {
        const vector = this.getPerformanceVector(student.id, allStudentsData);
        const similarity = this.cosineSimilarity(targetVector, vector);
        return { studentId: student.id, similarity };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topN);
    
    return similarities;
  }

  recommendTopics(targetStudentId, allStudentsData, topN = 3) {
    const similarStudents = this.findSimilarStudents(targetStudentId, allStudentsData);
    
    // Aggregate topics studied by similar students
    const topicScores = {};
    
    similarStudents.forEach(({ studentId, similarity }) => {
      const student = allStudentsData.find(s => s.id === studentId);
      if (student && student.topicsStudied) {
        student.topicsStudied.forEach(topic => {
          topicScores[topic] = (topicScores[topic] || 0) + similarity;
        });
      }
    });
    
    // Sort by score
    return Object.entries(topicScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([topic, score]) => ({ topic, score }));
  }

  getPerformanceVector(studentId, allStudentsData) {
    const student = allStudentsData.find(s => s.id === studentId);
    if (!student || !student.subjectScores) return [];
    
    // Create vector from subject scores
    return Object.values(student.subjectScores);
  }

  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    
    return normA && normB ? dotProduct / (normA * normB) : 0;
  }
}

// ADAPTIVE DIFFICULTY MANAGER
class AdaptiveDifficultyManager {
  constructor(irtEngine) {
    this.irt = irtEngine;
  }

  getNextDifficulty(studentId, subject, recentAnswers) {
    const { increaseThreshold, decreaseThreshold, windowSize } = AI_CONFIG.adaptive;
    
    // Get recent accuracy
    const window = recentAnswers.slice(-windowSize);
    if (window.length === 0) {
      return 'medium'; // Default for first question
    }
    
    const accuracy = window.filter(a => a.correct).length / window.length;
    const currentAbility = this.irt.getAbility(studentId, subject);
    
    // Decide difficulty adjustment
    if (accuracy >= increaseThreshold) {
      return this.mapAbilityToDifficulty(currentAbility + 0.5);
    } else if (accuracy <= decreaseThreshold) {
      return this.mapAbilityToDifficulty(currentAbility - 0.5);
    } else {
      return this.mapAbilityToDifficulty(currentAbility);
    }
  }

  mapAbilityToDifficulty(ability) {
    if (ability < -1) return 'easy';
    if (ability < 1) return 'medium';
    return 'hard';
  }

  getDifficultyParameters(difficulty) {
    const params = {
      easy: { b: -1.0, a: 1.0 },
      medium: { b: 0.0, a: 1.5 },
      hard: { b: 1.0, a: 2.0 },
    };
    return params[difficulty] || params.medium;
  }
}

// MAIN AI ENGINE
class AIEngine {
  constructor() {
    this.irt = new IRTEngine();
    this.bkt = new BayesianKnowledgeTracer();
    this.spacedRep = new SpacedRepetitionScheduler();
    this.collab = new CollaborativeFilter();
    this.adaptive = new AdaptiveDifficultyManager(this.irt);
    
    this.loadAll();
  }

  processAnswer(studentId, subject, skillId, answer) {
    const { questionId, correct, difficulty, timeTaken } = answer;
    
    // Get difficulty parameters
    const diffParams = this.adaptive.getDifficultyParameters(difficulty);
    
    // Update IRT model
    const newAbility = this.irt.updateAbility(
      studentId, 
      subject, 
      correct, 
      diffParams.b, 
      diffParams.a
    );
    
    // Update BKT model
    const newMastery = this.bkt.update(studentId, skillId, correct);
    
    // Update spaced repetition
    const quality = this.mapPerformanceToQuality(correct, timeTaken);
    this.spacedRep.review(studentId, skillId, quality);
    
    // Save all states
    this.saveAll();
    
    return {
      ability: newAbility,
      mastery: newMastery,
      recommendation: this.generateRecommendation(studentId, subject)
    };
  }

  getStudentProgress(studentId, subject) {
    return {
      ability: this.irt.getAbility(studentId, subject),
      mastery: this.bkt.getStudentMastery(studentId, subject),
      reviews: this.spacedRep.getStudentReviewCount(studentId, subject)
    };
  }

  generateRecommendation(studentId, subject) {
    // Get weak skills from BKT
    const allSkills = this.getAllSkillsForSubject(subject);
    const weakSkills = this.bkt.getWeakSkills(studentId, allSkills);
    
    // Get due reviews from spaced repetition
    const dueReviews = this.spacedRep.getDueCards(studentId, allSkills);
    
    // Get next optimal question from IRT
    // (would need question bank here)
    
    return {
      weakSkills: weakSkills.slice(0, 3),
      dueReviews: dueReviews.slice(0, 5),
      suggestedDifficulty: this.adaptive.mapAbilityToDifficulty(
        this.irt.getAbility(studentId, subject)
      )
    };
  }

  mapPerformanceToQuality(correct, timeTaken) {
    if (!correct) return timeTaken > 15 ? 0 : 1;
    if (timeTaken < 5) return 5;
    if (timeTaken < 10) return 4;
    return 3;
  }

  getAllSkillsForSubject(subject) {
    const skills = {
      ds: ['arrays', 'trees', 'graphs', 'heaps', 'linked_lists'],
      algo: ['sorting', 'searching', 'dp', 'greedy', 'divide_conquer'],
      db: ['sql', 'normalization', 'transactions', 'indexing'],
      oop: ['inheritance', 'polymorphism', 'encapsulation', 'abstraction'],
      net: ['tcp_ip', 'http', 'dns', 'routing'],
    };
    return skills[subject] || [];
  }

  saveAll() {
    this.irt.save();
    this.bkt.save();
    this.spacedRep.save();
  }

loadAll() {
    this.irt.load();
    this.bkt.load();
    this.spacedRep.load();
    
    fetch('./models/sala-irt-model.json')
      .then(r => r.json())
      .then(data => { 
        console.log('[AI] IRT model loaded successfully.');
        if(data.questions) {
            this.irt.trainedQuestions = data.questions;
        }
      })
      .catch(()=> { console.info('[AI] No IRT model found, using defaults.');});
      
    fetch('./models/sala-bkt-model.json')
      .then(r => r.json())
      .then(data => { 
        console.log('[AI] BKT model loaded successfully.');
        if(data.parameters) {
             AI_CONFIG.bkt.pInit = data.parameters.pInit;
             AI_CONFIG.bkt.pLearn = data.parameters.pLearn;
             AI_CONFIG.bkt.pSlip = data.parameters.pSlip;
             AI_CONFIG.bkt.pGuess = data.parameters.pGuess;
             console.log('[AI] Engine calibrated to Python BKT parameters.');
        }
      })
      .catch(() => { console.info('[AI] No BKT model found, using defaults.'); });
  }
}

// EXPORT & INITIALIZE

window.salaAI = new AIEngine();

console.log('✨ SALA AI Engine initialized with:');
console.log('  - Item Response Theory (IRT)');
console.log('  - Bayesian Knowledge Tracing (BKT)');
console.log('  - Spaced Repetition (SM-2)');
console.log('  - Collaborative Filtering');
console.log('  - Adaptive Difficulty');
console.log('  - generateRecommendation() method available for personalized suggestions.');

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AIEngine, IRTEngine, BayesianKnowledgeTracer, SpacedRepetitionScheduler, CollaborativeFilter, AdaptiveDifficultyManager };
}
