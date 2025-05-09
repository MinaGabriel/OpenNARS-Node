



## Data Structure 


### LUT (Lookup Table)
### Distribution

The `Distributor` class uses **balanced rank-based distribution** (also called **staircase distribution** or **weighted fair distribution**).

When you call `Distributor.new(range_val)` → you get a cached instance of `Distributor(range_val)`.

It builds an array:

$$
\text{capacity} = \frac{\text{range\_val} \times (\text{range\_val} + 1)}{2}
$$

with:

- $\text{range\_val}$ = levels, e.g., $4$
- $\text{capacity}$ = array length

---

**Example: \texttt{range\_val = 4}**

$$
\text{capacity} = \frac{4 \times (4 +1)}{2} = 10
$$

Start:

$$
[-1,\ -1,\ -1,\ -1,\ -1,\ -1,\ -1,\ -1,\ -1,\ -1]
$$

---

**Step 1:** insert $4$ × $3$, jump $\lfloor10/4\rfloor=2$

$$
[3,\ -1,\ -1,\ 3,\ -1,\ -1,\ 3,\ -1,\ -1,\ 3]
$$

---

**Step 2:** insert $3$ × $2$, jump $\lfloor10/3\rfloor=3$

$$
[3,\ 2,\ -1,\ 3,\ 2,\ -1,\ 3,\ 2,\ -1,\ 3]
$$

---

**Step 3:** insert $2$ × $1$, jump $\lfloor10/2\rfloor=5$

$$
[3,\ 2,\ 1,\ 3,\ 2,\ -1,\ 3,\ 2,\ 1,\ 3]
$$

---

**Step 4:** insert $1$ × $0$, jump $10/1=10$

$$
[3,\ 2,\ 1,\ 3,\ 2,\ 0,\ 3,\ 2,\ 1,\ 3]
$$

---

### Final sequence

$$
[3,\ 2,\ 1,\ 3,\ 2,\ 0,\ 3,\ 2,\ 1,\ 3]
$$

---

### Summary

- Higher ranks appear more often.
- Lower ranks are not starved.
- Values are evenly distributed.
