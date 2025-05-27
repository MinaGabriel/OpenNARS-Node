# Introduction to Task in NARS

In the **Non-Axiomatic Reasoning System (NARS)**, a **Task** represents a unit of reasoning that the system must process. A Task encapsulates a **Sentence** (a judgment, question, or goal) along with a **Budget**, which controls how much attention and resources the system should give it.

---

## Sentence = Term + Punctuation + (Optional) Truth/Desire

A **Sentence** in NARS is a structured expression composed of:

- A **Term** (e.g., a statement like `<bird --> animal>`)
- A **Punctuation**:
  - `.` for **Judgment**
  - `?` for **Question**
  - `!` for **Goal**
- Optional metadata:
  - **Truth** values for judgments
  - **Desire** values for goals

Example sentence: `<bird --> animal>. %0.95%`

This is a **judgment** asserting that "bird is an animal" with a frequency/confidence of 0.95.

---

## Budget = Priority, Durability, Quality

Each Task includes a **Budget**, which influences how it competes for processing:

- `p` — **Priority**: urgency
- `d` — **Durability**: relevance over time
- `q` — **Quality**: expected usefulness

Example budget:
``` 
╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
║                                        TASK LINK TABLE                                        ║
╟──────────────────────────────────────┬──────────────────────────┬─────────────────────┬───────╢
║ <Concept <A-->(/, A, D)>> (vLxV4D0f) │ <Task <A-->(/, A, D)> .> │ SELF                │       ║
╟──────────────────────────────────────┼──────────────────────────┼─────────────────────┼───────╢
║ <Concept A> (h-mvF9_C)               │ <Task <A-->(/, A, D)> .> │ COMPONENT_STATEMENT │ [0]   ║
╟──────────────────────────────────────┼──────────────────────────┼─────────────────────┼───────╢
║ <Concept (/, A, D)> (OBa8mAVe)       │ <Task <A-->(/, A, D)> .> │ COMPONENT_STATEMENT │ [1]   ║
╟──────────────────────────────────────┼──────────────────────────┼─────────────────────┼───────╢
║ <Concept A> (ultu6yKh)               │ <Task <A-->(/, A, D)> .> │ TRANSFORM           │ [1,0] ║
╟──────────────────────────────────────┼──────────────────────────┼─────────────────────┼───────╢
║ <Concept D> (eoPJVPf6)               │ <Task <A-->(/, A, D)> .> │ TRANSFORM           │ [1,1] ║
╚══════════════════════════════════════╧══════════════════════════╧═════════════════════╧═══════╝
```

In this example:

- The **Sentence** is `<bird --> animal>. %0.95%`
- The **Budget** is priority = 0.8, durability = 0.7, quality = 0.9

This task tells the system:
> “I strongly believe bird is an animal, and this belief is important and should be retained.”

---

## Internally

When parsed, this task may be created with a function like:
```ts
makeTask(
  new Judgment(
    new Statement("bird", "-->", "animal"),
    ".",
    new Truth(0.95)
  ),
  [0.8, 0.7, 0.9]
);


