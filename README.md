---
tags:
- logical-reasoning
- first-order-logic
- evaluation
- cot
- llm-benchmark
task_categories:
- text-classification
license: mit
pretty_name: LLM FOL Reasoning Eval
---

# 🧠 LLM FOL Reasoning Eval

This dataset is derived from **ProverQA**, a First-Order Logic reasoning benchmark designed to test the ability of large language models (LLMs) to perform structured logical reasoning.  
It restructures and normalizes the ProverQA development and training data into a unified, clean format suitable for evaluating **chain-of-thought (CoT)** and **symbolic reasoning** capabilities in LLMs.

---

## 📚 Source

Original dataset: [**ProverQA: A First-Order Logic Reasoning Dataset**](https://github.com/opendatalab/ProverGen)  
From the paper:  
> *Large Language Models Meet Symbolic Provers for Logical Reasoning Evaluation*  
> Qi et al., ICLR 2025  
> [OpenReview link](https://openreview.net/forum?id=C25SgeXWjE)

---

## 🎯 Purpose

This dataset can be used to measure how well a model:
- Parses complex logical premises and rules
- Performs multi-step reasoning under uncertainty
- Distinguishes between *True*, *False*, and *Uncertain* conclusions
- Handles nested implications, negations, and exclusive disjunctions (XOR)

---

## 🧩 Dataset Overview

Each record contains:
| Field | Description |
|--------|-------------|
| `id` | Unique identifier |
| `difficulty` | easy / medium / hard |
| `context` | Background premises and rules |
| `question` | Query about the conclusion |
| `nl` | Natural-language combination of context + question |
| `fact_count` / `rule_count` | Number of facts and rules detected |
| `reasoning_joined` | Natural language reasoning steps |
| `fol_joined` | Merged first-order logic representations |
| `conclusion_fol` | FOL statement representing the conclusion |
| `answer` | Final label: True / False / Uncertain |

---

## 🧠 Example

```json
{
  "id": "0",
  "difficulty": "easy",
  "context": "Brecken has experienced heartbreak. Either Brecken has experienced heartbreak or he has never experienced heartbreak, but not both.",
  "question": "Based on the above information, is the following statement true, false, or uncertain? Brecken has never experienced heartbreak.",
  "nl": "Brecken has experienced heartbreak. Either Brecken has experienced heartbreak or he has never experienced heartbreak, but not both.\n\nBased on the above information, is the following statement true, false, or uncertain? Brecken has never experienced heartbreak.",
  "fact_count": 1,
  "rule_count": 1,
  "reasoning_joined": "fact1: Brecken has experienced heartbreak.\nrule1: Either Brecken has experienced heartbreak or he has never experienced heartbreak, but not both.",
  "fol_joined": "has_experienced_heartbreak(Brecken)\nhas_experienced_heartbreak(Brecken) ⊕ has_never_experienced_heartbreak(Brecken)",
  "conclusion_fol": "has_never_experienced_heartbreak(Brecken)",
  "answer": "False"
}

