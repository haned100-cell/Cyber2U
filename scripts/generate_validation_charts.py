#!/usr/bin/env python3
import json
from pathlib import Path

import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[1]
DATASET_PATH = ROOT / 'docs' / 'validation' / 'synthetic_feedback_dataset.json'
CHART_DIR = ROOT / 'docs' / 'validation' / 'charts'


def load_data():
  if not DATASET_PATH.exists():
    raise FileNotFoundError(f'Dataset not found: {DATASET_PATH}')

  with DATASET_PATH.open('r', encoding='utf-8') as handle:
    data = json.load(handle)

  if not isinstance(data, list) or len(data) == 0:
    raise ValueError('Dataset is empty or malformed.')

  return data


def save_rating_distribution(data):
  CHART_DIR.mkdir(parents=True, exist_ok=True)

  usability = [entry['usabilityRating'] for entry in data]
  clarity = [entry['contentClarityRating'] for entry in data]
  confidence = [entry['confidenceImprovementRating'] for entry in data]

  bins = [1, 2, 3, 4, 5, 6]

  fig, ax = plt.subplots(figsize=(10, 6))
  ax.hist([usability, clarity, confidence], bins=bins, label=['Usability', 'Clarity', 'Confidence'], alpha=0.75)
  ax.set_title('Cyber2U Synthetic Study Rating Distribution')
  ax.set_xlabel('Rating')
  ax.set_ylabel('Count')
  ax.set_xticks([1, 2, 3, 4, 5])
  ax.legend()
  ax.grid(axis='y', linestyle='--', alpha=0.35)
  fig.tight_layout()
  fig.savefig(CHART_DIR / 'rating_distribution.png', dpi=180)
  plt.close(fig)


def save_variant_recommendation(data):
  variants = sorted({entry['journeyVariant'] for entry in data})
  means = []

  for variant in variants:
    scores = [entry['recommendationRating'] for entry in data if entry['journeyVariant'] == variant]
    means.append(sum(scores) / len(scores))

  fig, ax = plt.subplots(figsize=(10, 6))
  bars = ax.bar(variants, means, color=['#0f766e', '#0891b2', '#f59e0b', '#475569'])
  ax.set_ylim(0, 10)
  ax.set_ylabel('Average Recommendation (0-10)')
  ax.set_title('Average Recommendation by Journey Variant')
  ax.grid(axis='y', linestyle='--', alpha=0.35)

  for bar, value in zip(bars, means):
    ax.text(bar.get_x() + bar.get_width() / 2, value + 0.15, f'{value:.2f}', ha='center', va='bottom')

  fig.tight_layout()
  fig.savefig(CHART_DIR / 'recommendation_by_variant.png', dpi=180)
  plt.close(fig)


def save_continue_intent(data):
  yes_count = sum(1 for entry in data if entry['wouldContinue'])
  no_count = len(data) - yes_count

  fig, ax = plt.subplots(figsize=(7, 7))
  ax.pie(
    [yes_count, no_count],
    labels=['Would Continue', 'Would Not Continue'],
    autopct='%1.1f%%',
    startangle=120,
    colors=['#16a34a', '#dc2626'],
  )
  ax.set_title('Continuation Intent (Synthetic Responses)')
  fig.tight_layout()
  fig.savefig(CHART_DIR / 'continuation_intent.png', dpi=180)
  plt.close(fig)


def main():
  data = load_data()
  save_rating_distribution(data)
  save_variant_recommendation(data)
  save_continue_intent(data)
  print(f'Charts written to {CHART_DIR}')


if __name__ == '__main__':
  main()
