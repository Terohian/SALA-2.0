#!/usr/bin/env python3
"""
SALA AI Model Training Pipeline
Trains IRT, BKT, and Neural models on open-source educational datasets
"""

from ast import Load

import pandas as pd
import numpy as np
import json
import os
from pathlib import Path
from scipy.optimize import minimize
from sklearn.model_selection import train_test_split
from tqdm import tqdm

import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print("Model training initiated...")

CONFIG = {
    'data_dir': 'datasets',
    'output_dir': './models',
    'random_seed': 42,
    'test_size': 0.2,
}

np.random.seed(CONFIG['random_seed'])

class DataLoader:
    """Load and preprocess educational datasets"""
    
    @staticmethod
    def load_assistments(filepath):
        """
        Load ASSISTments dataset
        Download from: https://sites.google.com/site/assistmentsdata/
        """
        print("Loading ASSISTments dataset...")
        
        #Check if file exists
        if not os.path.exists(filepath):
            print(f"⚠️  File not found: {filepath}")
            print("  Download from: https://sites.google.com/site/assistmentsdata/")
            return None
        
        df = pd.read_csv(filepath)
        
        df_processed = pd.DataFrame({
            'student_id': df['user_id'],
            'question_id': df['problem_id'],
            'correct': df['correct'].astype(int),
            'skill_name': df['skill_name'],
            'time_taken': df['ms_first_response'] / 1000,  # Convert to seconds
            'hint_count': df.get('hint_count', 0),
            'attempt_count': df.get('attempt_count', 1),
        })
        
        df_processed = df_processed.dropna(subset=['student_id', 'question_id', 'correct'])
        df_processed = df_processed[df_processed['time_taken'] > 0]
        
        print(f"✅ Loaded {len(df_processed):,} interactions")
        print(f"   {df_processed['student_id'].nunique():,} students")
        print(f"   {df_processed['question_id'].nunique():,} questions")
        print(f"   {df_processed['skill_name'].nunique():,} skills")
        
        return df_processed
    
    @staticmethod
    def load_ednet(directory):
        """
        Load EdNet dataset
        Download from: https://github.com/riiid/ednet
        """
        print("📂 Loading EdNet dataset...")
        
        #EdNet is split into multiple files
        files = list(Path(directory).glob('*.csv'))
        
        if not files:
            print(f"⚠️  No CSV files found in: {directory}")
            return None
        
        dfs = []
        for file in tqdm(files[:10], desc="Loading files"):  # Limit to first 10 files
            df = pd.read_csv(file)
            dfs.append(df)
        
        df = pd.concat(dfs, ignore_index=True)
        
        #Process to standard format
        df_processed = pd.DataFrame({
            'student_id': df['user_id'],
            'question_id': df['item_id'],
            'correct': df['user_answer'] == df['correct_answer'],
            'skill_name': df['part'].astype(str),
            'time_taken': df['elapsed_time'] / 1000,
        })
        
        df_processed = df_processed.dropna()
        
        print(f"✅ Loaded {len(df_processed):,} interactions")
        return df_processed
    
    @staticmethod
    def create_synthetic_data(n_students=1000, n_questions=500):
        """
        Create synthetic dataset for testing
        Use this if you don't have real datasets yet
        """
        print("🔧 Creating synthetic dataset...")
        
        student_abilities = np.random.randn(n_students)

        question_difficulties = np.random.randn(n_questions)
        question_discriminations = np.random.uniform(0.5, 2.5, n_questions)
        
        n_skills = 10
        question_skills = np.random.randint(0, n_skills, n_questions)
        
        interactions = []
        
        for student_id in range(n_students):
            ability = student_abilities[student_id]
            n_attempts = np.random.randint(10, 31)
            question_ids = np.random.choice(n_questions, n_attempts, replace=False)
            
            for question_id in question_ids:
                b = question_difficulties[question_id]
                a = question_discriminations[question_id]
                
                prob_correct = 1 / (1 + np.exp(-a * (ability - b)))
                correct = np.random.random() < prob_correct
                
                #Time taken (easier questions = less time)
                base_time = 15 + (b + 3) * 5
                time_taken = np.random.exponential(base_time)
                
                interactions.append({
                    'student_id': student_id,
                    'question_id': question_id,
                    'correct': int(correct),
                    'skill_name': f'skill_{question_skills[question_id]}',
                    'time_taken': time_taken,
                    'hint_count': np.random.poisson(0.5) if not correct else 0,
                    'attempt_count': 1,
                })
        
        df = pd.DataFrame(interactions)
        
        print(f"✅ Created {len(df):,} synthetic interactions")
        print(f"   {n_students} students")
        print(f"   {n_questions} questions")
        print(f"   {n_skills} skills")
        
        return df


# IRT MODEL TRAINING
class IRTTrainer:
    """Train Item Response Theory models"""
    
    def __init__(self, df):
        self.df = df
        self.student_map = {sid: i for i, sid in enumerate(df['student_id'].unique())}
        self.question_map = {qid: i for i, qid in enumerate(df['question_id'].unique())}
        self.n_students = len(self.student_map)
        self.n_questions = len(self.question_map)
    
    def train_2pl(self, max_iter=100):
        """Train 2-parameter logistic IRT model"""
        print("🧠 Training IRT 2PL model...")
        
        theta = np.random.randn(self.n_students) * 0.5  # Student abilities
        b = np.random.randn(self.n_questions) * 0.5      # Difficulties
        a = np.random.uniform(0.8, 1.2, self.n_questions)  # Discriminations
        
        n_interactions = len(self.df)
        student_idx = np.array([self.student_map[sid] for sid in self.df['student_id']])
        question_idx = np.array([self.question_map[qid] for qid in self.df['question_id']])
        correct = self.df['correct'].values
        
        def negative_log_likelihood(params):
            """Compute negative log-likelihood"""
            theta = params[:self.n_students]
            b = params[self.n_students:self.n_students + self.n_questions]
            a = params[self.n_students + self.n_questions:]
            
            theta = np.clip(theta, -5, 5)
            b = np.clip(b, -5, 5)
            a = np.clip(a, 0.1, 5)
            
            z = a[question_idx] * (theta[student_idx] - b[question_idx])
            z = np.clip(z, -10, 10)
            p = 1 / (1 + np.exp(-z))
            p = np.clip(p, 1e-10, 1 - 1e-10)
            
            ll = correct * np.log(p) + (1 - correct) * np.log(1 - p)
            return -np.sum(ll)
    
        initial_params = np.concatenate([theta, b, a])
        
        print("   Optimizing parameters...")
        result = minimize(
            negative_log_likelihood,
            initial_params,
            method='L-BFGS-B',
            options={'maxiter': max_iter}
        )
        
        self.theta = result.x[:self.n_students]
        self.b = result.x[self.n_students:self.n_students + self.n_questions]
        self.a = result.x[self.n_students + self.n_questions:]
        
        print(f"✅ IRT training complete")
        print(f"   Final log-likelihood: {-result.fun:.2f}")
        print(f"   Mean ability: {self.theta.mean():.2f} (SD: {self.theta.std():.2f})")
        print(f"   Mean difficulty: {self.b.mean():.2f} (SD: {self.b.std():.2f})")
        print(f"   Mean discrimination: {self.a.mean():.2f} (SD: {self.a.std():.2f})")
        
        return self
    
    def export_json(self, output_path):
        """Export trained parameters to JSON"""
        
        student_ids = {i: sid for sid, i in self.student_map.items()}
        question_ids = {i: qid for qid, i in self.question_map.items()}
        
        model = {
            'version': 1,
            'type': 'IRT_2PL',
            'students': {
                str(student_ids[i]): float(self.theta[i])
                for i in range(self.n_students)
            },
            'questions': {
                str(question_ids[i]): {
                    'difficulty': float(self.b[i]),
                    'discrimination': float(self.a[i])
                }
                for i in range(self.n_questions)
            },
            'statistics': {
                'n_students': self.n_students,
                'n_questions': self.n_questions,
                'mean_ability': float(self.theta.mean()),
                'mean_difficulty': float(self.b.mean()),
                'mean_discrimination': float(self.a.mean()),
            }
        }
        
        with open(output_path, 'w') as f:
            json.dump(model, f, indent=2)
        
        print(f"💾 IRT model saved to {output_path}")


# BKT MODEL TRAINING
class BKTTrainer:
    """Train Bayesian Knowledge Tracing models"""
    
    def __init__(self, df):
        self.df = df
    
    def train(self):
        """Train BKT parameters"""
        print("🧠 Training BKT model...")
        
        def bkt_likelihood(params):
            """Compute negative log-likelihood"""
            p_L0, p_T, p_S, p_G = params
            
            # Ensure valid probabilities
            if not (0 < p_L0 < 1 and 0 < p_T < 1 and 0 < p_S < 1 and 0 < p_G < 1):
                return 1e10
            
            log_likelihood = 0
            
            # Process each student separately
            for student_id in self.df['student_id'].unique():
                student_data = self.df[self.df['student_id'] == student_id]
                
                p_L = p_L0  # Initial knowledge
                
                for correct in student_data['correct'].values:
                    # Probability of correct response
                    p_correct = p_L * (1 - p_S) + (1 - p_L) * p_G
                    p_correct = np.clip(p_correct, 1e-10, 1 - 1e-10)
                    
                    # Update likelihood
                    if correct:
                        log_likelihood += np.log(p_correct)
                        # Update P(L | correct)
                        p_L = (p_L * (1 - p_S)) / p_correct
                    else:
                        log_likelihood += np.log(1 - p_correct)
                        # Update P(L | incorrect)
                        p_L = (p_L * p_S) / (1 - p_correct)
                    
                    # Learning step
                    p_L = p_L + (1 - p_L) * p_T
                    p_L = np.clip(p_L, 0, 1)
            
            return -log_likelihood
        
        # Optimize BKT parameters
        initial = [0.1, 0.3, 0.1, 0.25]  # [p_L0, p_T, p_S, p_G]
        bounds = [(0.001, 0.999)] * 4
        
        print("   Optimizing parameters...")
        result = minimize(
            bkt_likelihood,
            initial,
            bounds=bounds,
            method='L-BFGS-B',
            options={'maxiter': 50}
        )
        
        self.p_L0, self.p_T, self.p_S, self.p_G = result.x
        
        print(f"✅ BKT training complete")
        print(f"   P(L0) = {self.p_L0:.3f} (initial knowledge)")
        print(f"   P(T)  = {self.p_T:.3f} (learning rate)")
        print(f"   P(S)  = {self.p_S:.3f} (slip probability)")
        print(f"   P(G)  = {self.p_G:.3f} (guess probability)")
        
        return self
    
    def export_json(self, output_path):
        """Export trained parameters to JSON"""
        model = {
            'version': 1,
            'type': 'BKT',
            'parameters': {
                'pInit': float(self.p_L0),
                'pLearn': float(self.p_T),
                'pSlip': float(self.p_S),
                'pGuess': float(self.p_G),
            }
        }
        
        with open(output_path, 'w') as f:
            json.dump(model, f, indent=2)
        
        print(f"💾 BKT model saved to {output_path}")


def main():
    print("=" * 60)
    print("SALA AI MODEL TRAINING PIPELINE")
    print("=" * 60)
    print()

    os.makedirs(CONFIG['output_dir'], exist_ok=True)
    
    print("Load Data")
    print("-" * 60)
    
    assistments_path = os.path.join(CONFIG['data_dir'], 'assistments_2009_2010.csv')
    
    df = DataLoader.load_assistments(assistments_path)
    
    if df is None:
        print("⚠️  Using synthetic data (download real datasets for production)")
        df = DataLoader.create_synthetic_data()
    print()
    
    print("Train IRT Model")
    print("-" * 60)
    
    irt_trainer = IRTTrainer(df)
    irt_trainer.train_2pl()
    irt_trainer.export_json(os.path.join(CONFIG['output_dir'], 'sala-irt-model.json'))
    print()
    
    print("Train BKT Model")
    print("-" * 60)
    
    bkt_trainer = BKTTrainer(df)
    bkt_trainer.train()
    bkt_trainer.export_json(os.path.join(CONFIG['output_dir'], 'sala-bkt-model.json'))
    print()
     
    print("=" * 60)
    print("✅ TRAINING COMPLETE!")
    print("=" * 60)
    print(f"\nModels saved to: {CONFIG['output_dir']}/")
    print("\nNext steps:")
    print("1. Copy JSON files to your SALA app directory")
    print("2. Update sala-ai-engine.js to load these models")
    print("3. Test with real user interactions")
    print("4. Set up continuous retraining pipeline")

if __name__ == '__main__':
    main()
