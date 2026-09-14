# KITO Mastermind — What is built

**For review.** This is a map of the product as it exists today: who it is for, how people move through it, what each role can do, and the rules the system already enforces.

It is written for a product conversation, not a technical one. Use it to mark **keep**, **change**, **add**, or **remove**.

A live copy of the app is at [kito-mastermind.onrender.com](https://kito-mastermind.onrender.com). Sign-in is invitation-only. Temporary reviewer shortcuts on the sign-in page let you open each role without an invite.

---

## How to use this document

1. Read **What KITO is** and **The lock** first. Those two decisions shape everything else.
2. Walk the **member journey**, then the extra power of Treasurer, Chapter Lead, and Admin.
3. For every section, ask: *Is this how our chapter actually works?* If not, write what should happen instead.
4. Use the **numbers and defaults** list at the end as a checklist of knobs you can turn without inventing a new product.
5. Use **Not switched on yet** so you do not review a feature as if it were live money or live email.

Nothing here is a proposal. It is what members already see and what the rules already do.

---

## What KITO is

KITO Mastermind is a **private accountability circle for Kenyan production real-estate chapters**.

It is not a public marketplace, not a CRM for the whole chapter, and not a group chat. It is the locked room where a chapter:

- logs work
- matches complementary leads **without leaking client names**
- holds partners to promises
- keeps dues, points, and the monthly lesson in one place

The public homepage promise is:

> Members keep promises, match work, and close deals — without exposing another agent’s clients.

The four moves the site teaches visitors:

1. **Enter the circle** — invitation only. No public signup.
2. **Log the work** — leads, promises, and lessons live here instead of inboxes.
3. **Match without leak** — another agent can see that a complementary lead exists; they cannot see the client until the owner says yes.
4. **Keep the score** — partners verify actions; points and dues sit next to the work.

**Review this:** Is “invitation-only chapter room” the product you want, or should there be public discovery, multi-chapter marketplaces, or a lighter social feed?

---

## The lock (the rule everything else obeys)

A client’s **name, phone, email, and notes belong to the agent who logged the lead**.

- The chapter pool shows type, area, budget, property, timeline, status, and which agent logged it — **not** the client.
- A match is not access. Seeing a match is not access. Being Chapter Lead or Admin is not access.
- Access is **per lead**, **granted by the owner**, and **revocable**.
- Emails and in-app alerts never include client names. They use agent names, areas, and lead types only.
- The member agreement (version 2026-01) says you will not export, screenshot, or reuse another member’s client details obtained through a grant.

This is a permanent product decision in the current build: **there is no admin override.** An Admin cannot open another member’s client file because they are Admin.

**Review this:** Keep the lock as-is? Or should a Chapter Lead / Admin be able to see client details in a dispute, a data-protection request, or a handover when someone leaves?

---

## Who is in the circle

Four roles. Each role **includes** everything below it, plus extra power.

| Role | In one sentence |
|------|-----------------|
| **Member** | Logs work, matches, keeps promises, pays, posts a lesson. |
| **Treasurer** | Member, plus records and allocates chapter money. |
| **Chapter Lead** | Runs the chapter: invites, sessions, pairings, topics, verification. |
| **Admin** | Runs the network: chapters, cycles, any role, full audit. Still cannot open another agent’s client file. |

Only an **Admin** can create a Chapter Lead or another Admin. A Chapter Lead can invite **Members** and **Treasurers** only.

A person cannot change their own role or deactivate themselves.

**Review this:** Are these the four seats you want? Missing roles (for example: mentor, regional manager, guest speaker)? Should a Chapter Lead be able to appoint another Chapter Lead?

---

## How a person gets in

There is no “Create account” on the public site.

1. A Chapter Lead or Admin **sends an invitation** to an email, with a role and a chapter.
2. The invitee opens the link (**Join your chapter**). The page shows their email, chapter, and role.
3. They set full name, password (at least 12 characters), phone, brokerage, and tick the **member agreement**.
4. **Accept invitation** creates their account. They are signed in. There is no extra email-confirm step in this flow.
5. The link **expires in 14 days**. It can be revoked or resent. If it is already used, expired, or revoked, they must ask their lead for a new one.

If someone is later **deactivated**, they see **Your account is not active** and must contact their chapter lead.

**Sign in:** email and password, optional “Keep me signed in”, forgot-password by email. After **5 failed attempts in 15 minutes**, sign-in is locked with a wait.

**Review this:** 14-day invites, 12-character passwords, lockout after 5 tries — keep or change? Should new members also confirm email, upload a licence, or wait for a lead to approve after they accept?

---

## Temporary reviewer logins (for this review only)

On the live sign-in page there are four chips labelled **Reviewer logins · temporary**. They fill email and password and sign in as:

| Chip | Person | Role |
|------|--------|------|
| Member | Daniel Otieno | Member |
| Treasurer | Grace Wanjiru | Treasurer |
| Chapter lead | Amina Hassan | Chapter Lead |
| Admin | James Gitonga | Admin |

Password for all four: `Kito-Demo-2026!`

These are for walking the product. They are **not** how real members will join. They should be removed before a real chapter goes live.

---

# A member’s week

This is the main product. Treasurer / Lead / Admin add tools on top of this.

## 1. Home — Dashboard

After sign-in, the member lands on **Dashboard**.

Greeting: **Good morning / afternoon / evening, [first name]**, with the current cycle and week, and when the next mastermind session is.

Four scorecards:

- **Points this cycle** — for example `142 / 600`, rank in the chapter, and a bar split into Production, Referrals, Attendance, Response Time, Contributions.
- **Response time** — a grade (A–F) and median minutes to first-touch a lead, or “Not enough leads yet”.
- **Closed volume (cycle)** — verified deal volume credited to this member.
- **Referrals sent / received**.

Then:

- **Your accountability actions** — open promises, with a jump to the Accountability page.
- **Chapter lead pipeline** — only if the chapter has at least three active members. Each member’s active lead count and how far those leads have moved (New → Contacted → Qualified → Under contract → Closed).
- **Closed business** — deals that still need this member to confirm their split, or a lead to verify.
- **New lead match found** — latest match, with “request contact” or “message”.
- **This month** — the current forum topic, with **Post your lesson**.

**Review this:** Is this the right home? Too much scoreboard, not enough work-to-do? Should pipeline be Member-visible or Lead-only?

---

## 2. Leads

The chapter’s working inventory. Two tabs: **My leads** and **Chapter pool**.

Status filters: All, New, Contacted, Qualified, Under contract, Closed, Lost.

### My leads

The member sees **their** clients: name (when they own it), type, status. They can open a lead, change status, delete it, manage who has access, and close a deal.

### Chapter pool

Everyone in the chapter sees **redacted** cards: Agent, Type, Area, Budget, Property, Timeline, Status, Age. **No client names.**

### Log a lead (wizard)

**Details → Matching → Review.**

**Details** asks for:

- Client full name, phone, email
- Lead type: Buyer, Seller, Rental seeker, Rental lister
- Area / neighbourhood (search of Nairobi areas, or typed if no match)
- Property type, budget min/max, timeline, source, notes
- A confirmation that **the client agreed** to their details being recorded

Privacy is not a choice in this version: **client contact stays private** and the toggle cannot be turned off.

The member can **Save as draft** or **Find matches**.

CRM brands (Follow Up Boss, HubSpot, kvCORE, Zoho) appear as **Coming soon**. They do not connect in this version.

**Matching** runs complementary pairs **inside the same chapter only**:

- Buyer ↔ Seller
- Rental seeker ↔ Rental lister

It will not match closed or lost leads, or two leads owned by the same person.

How a match is scored (100 points max):

| Piece | Weight |
|-------|--------|
| Area overlap | 40 |
| Budget overlap | 30 |
| Property type | 20 |
| Timeline | 10 |

A match must score at least **55** to appear. The member sees up to **10**. **80 or above** is labelled **strong**. Near-miss budgets still get a little credit so two ranges that almost touch are not scored as zero.

**Review** shows strong vs partial matches. Each card shows score and which pieces matched. A lock line says contact is hidden until the other agent approves. Actions: **Request contact access**, **Message [Name] in KITO Mastermind**. Copy tells both owners they will be notified. If nothing matches, the lead is still saved and the member is told they will be notified later.

The system also looks for new matches overnight when the pool changes.

**Review this:** Chapter-only matching — keep? Allow neighbouring chapters? Change the score weights? Allow “open” leads where the owner publishes the client name to the chapter?

---

## 3. Asking for a client’s contact

1. Member A sees Member B’s lead in the pool or as a match.
2. A sends a **request** (optional short note). Limited to **8 requests per hour**.
3. B is told in the Inbox (and by email if they opted in): “[A] requested contact access on a [buyer/seller/…] lead in [area].”
4. B **approves**, **declines**, or ignores it. Ignored requests **die after 14 days**.
5. If approved, A can see name, phone, email, and notes on that **one** lead. The grant stays until B **revokes** it.
6. If revoked, A loses contact on the next visit. A is notified that access was revoked.

The owner’s lead page has an **Access** panel: who currently has access (with revoke), pending requests (approve / decline), and history.

**Review this:** 14-day pending expiry, grants that never expire until revoked — keep? Should grants auto-end after a deal closes, after 30 days, or when the lead is marked Lost?

---

## 4. Match thread (private messages)

If two leads match, the two **owners** can open a **Match thread**. Copy: messages here are between you and the other agent only.

Chapter Lead and Admin **cannot** read that thread.

Limited to **40 messages per hour**.

**Review this:** Should the chapter lead be able to see match conversations in a dispute? Should unmatched members be able to message each other at all?

---

## 5. Opening a lead and closing a deal

On a lead the member owns (or has been granted):

- They see contact if allowed, plus type, area, property, budget.
- If they are the owner, they can change status along: New → Contacted → Qualified → Under contract → Closed / Lost, or delete the lead.
- **Close deal:** sale volume, date, and an optional split with another chapter member. Default split is **75 closer / 25 referrer**, editable on that deal.
- Each participant must **confirm their share**. A Chapter Lead or Admin **verifies** the closed business before it counts for volume and production points.

When someone with a grant **first touches** the lead, the person who **granted** access can earn **referral points**.

Leads marked closed or lost and older than **24 months** have client name replaced with a purged marker and contact fields cleared. That is a privacy clean-up, not a member action.

**Review this:** 75/25 default — keep? Who must verify a deal — only Chapter Lead, or also the other participant? 24-month purge — too soon, too late, or never?

---

## 6. Accountability

**Follow-through** with a partner for the current cycle.

The Chapter Lead assigns partners **once per cycle** (pairs, or a triple if the numbers need it). A member can **request a new pairing**; that request does not unpair anyone until the lead acts.

If unpaired, the page says the chapter lead assigns partners at the start of each cycle.

What the member sees:

- Completion rate this cycle, current streak, actions completed (all time), chapter average
- **Your partner** — name, how long they have been paired, mutual rate, email
- **Your action steps** — create a promise, mark it complete
- **Tracking for [Partner]** — verify their completed steps; **Nudge** if overdue (once per action per 24 hours; 10 nudges per hour overall)
- Completion trend and past partners

Statuses: Not started, In progress, Due, Overdue, Completed (waiting for verify), Verified.

**The person who owns the action cannot verify it.** Partner, Chapter Lead, or Admin can.

Overnight, due dates that have passed become **Overdue**.

**Review this:** Pairing per cycle vs weekly vs standing pairs? Should a member verify their own small tasks? Is “nudge” enough, or do you want public chapter shame / praise?

---

## 7. Forum (monthly lesson)

One **monthly topic** for the whole network. Each member may post **one lesson** on that topic.

The feed defaults to **My chapter**, with **All chapters**, **Top rated**, and **Most recent**.

Composer: a one-line takeaway, then what worked. They can save and edit that one lesson.

Others can **star-rate** a lesson and **reply**. You cannot rate your own lesson.

Chapter Lead / Admin can **hide** a post.

Sidebar: top lessons this quarter, topic archive. Past months are read-only.

If no topic is open: “No topic is open this month yet.”

**Review this:** One lesson per person per month — keep? Should topics be per chapter instead of network-wide? Do you want anonymous lessons?

---

## 8. Points

A cycle scoreboard. Default ceiling: **600 points** for the whole cycle (an Admin can set a different cap per cycle).

| Category | Default cap | How a member earns it |
|----------|-------------|------------------------|
| **Production** | 180 | 1 point per KES 500,000 of **verified** closed volume (their credit share) |
| **Referrals** | 150 | 30 points when someone they granted access to **first-touches** that lead |
| **Attendance** | 120 | 20 for present at a session; 15 if marked late |
| **Response time** | 90 | From median minutes to first-touch, once they have at least 3 touched leads: A (≤30 min) = 90, B (≤2 hours) = 65, C (≤8 hours) = 40, D (≤24 hours) = 15, F = 0 |
| **Contributions** | 60 | 10 if dues paid on time, 5 if paid late, 0 if unpaid |

Points are recalculated overnight. Rank versus the chapter shows on the dashboard.

Empty state: points appear after the first session.

**Review this:** These weights came from the original chapter design. Too kind to attendance? Too hard on response time? Should closed rentals score differently from sales?

---

## 9. Reports — money

**Contributions and reports.**

Scorecards: contributed this cycle, all-time, outstanding balance, chapter total this cycle (visible when the role may see the chapter ledger).

History can be filtered by type (**Dues, Fines, Event fees, Donations**) and status (**Paid / Pending**).

A bar chart shows **chapter contributions by month**.

**Generate statement** — this cycle, this year, all time, or a custom period; PDF or CSV. Optionally a **chapter financial report** for Treasurer. The file is emailed (when email is configured) and kept in an archive the member can download again.

**Pay with M-Pesa** on a pending item — **only if M-Pesa is switched on**. Today it is **off**. The member is told to ask the treasurer to record the payment.

Dues are **created automatically on the 1st of the month** for active members, from the chapter’s dues schedule.

Documented money defaults until you say otherwise:

- Nairobi dues **KES 5,000 / month**
- Late-attendance fine **KES 1,000** (recorded by hand as a Fine, not invented by the system)

**Review this:** Dues amount, fine amount, auto-dues on the 1st, statement formats. Should members be able to see each other’s balances, or only their own plus a chapter total?

---

## 10. Inbox

The bell and **Notifications** page.

Empty: “You are caught up. New matches, access requests and nudges will appear here.”

Everything below lands in the Inbox. Some can also email **immediately** if the member turned that on. The rest can ride a **daily digest** (aimed at 07:00 Nairobi) if digest is on.

| Alert | Typical meaning |
|-------|-----------------|
| New lead match found | Someone logged a complementary lead |
| Access request / granted / not shared / revoked | Contact access lifecycle |
| Accountability due / overdue | A promise is due |
| Verification needed / action verified | Partner loop |
| Nudge | Partner or lead poked an overdue action |
| Contribution due / received | Money |
| Forum topic opened / reply | Lesson |
| Match message | Private thread |
| Deal confirmation needed | Split or verify a close |
| Points awarded | Scoreboard moved |

**Never in these messages:** client name, phone, email, notes.

**Review this:** Too many pings? Which ones must be immediate? Is 07:00 Nairobi the right digest hour?

---

## 11. Settings

- **Profile:** full name, phone, brokerage. Callout: profile stays in the chapter; client details never live on this screen.
- **Password.**
- **Email preferences:** daily digest on/off; immediate email per type (access, verification, nudge, match message, deal confirmation).
- **CRM connections:** shown, all **disabled** for this version.

**Review this:** Any other profile fields (licence number, photo, areas of practice)? Should members hide their phone from partners?

---

# Extra power by role

## Treasurer (on top of Member)

- **Record a contribution** for any chapter member (type, amount, method: M-Pesa / cash / bank).
- **Void** a contribution they recorded, within **30 days**.
- See the **chapter ledger** and generate a **chapter financial report**.
- Open **Unallocated payments**: M-Pesa receipts that arrived but are not tied to a member’s bill yet. They match a receipt to a pending contribution **by hand**. The system will not guess.

The Admin menu in the sidebar is **hidden** from Treasurers. They are not meant to invite, run sessions, or assign partners.

**Review this:** Should Treasurer also sit in Admin? Should voiding be 7 days, 30 days, or never without Admin?

---

## Chapter Lead (on top of Member)

Sidebar shows **Admin**. Hub title: **Chapter admin**.

| Tool | What the lead does |
|------|--------------------|
| **Members** | Invite Member or Treasurer. Change those roles inside the chapter. Deactivate a member (not themselves). Resend invites. |
| **Sessions** | Create a mastermind session (date/time, optional linked topic). Mark **Present** or **Late**. |
| **Topics** | Open the monthly forum prompt (title, body, month, when voting closes). |
| **Pairings** | Assign pairs/triples for the cycle, using suggestions or by hand. Handle pairing-change requests. |
| **Payments** | Same unallocated M-Pesa queue as Treasurer. |
| **Audit** | See chapter (and own) events. Filter. Run **export** or **erase contact fields** for a data-protection request. The log records *that* a contact was viewed, not the contact itself. |

Chapter Lead can also:

- Verify accountability actions and closed deals
- Nudge overdue actions
- Hide forum posts
- See the dashboard pipeline when the chapter is large enough

They **cannot**:

- Invite or promote Chapter Lead / Admin
- Create chapters, change dues schedules, or create cycles
- Open another agent’s client file

**When a member is deactivated:** they cannot sign in. Grants **to them** are revoked. Leads they **own** and grants they **gave** stay. Contribution history stays. They drop out of chapter averages.

**Review this:** Is deactivation the right “firing / leaving” model, or do you need a handover wizard (reassign leads, reassign partner, notify clients)? Should attendance be self-marked?

---

## Admin (on top of Chapter Lead)

Everything a lead can do, across the network, plus:

- Invite **any** role, including Chapter Lead and Admin
- Change **any** role; deactivate anyone except themselves
- **Chapters and dues** — create/edit chapters (name, code, region, active); set dues amount, day of month, effective date
- **Cycles** — name (for example Q4 2026), start/end, points cap
- Void contributions with **no 30-day limit**
- Full audit log

Still **cannot** see client PII without owning the lead or holding a grant.

Chapters already named in the live bootstrap: **Nairobi, Mombasa, Kisumu, Nakuru**.

**Review this:** One Admin for the whole network, or a Super-admin plus city admins? Who is allowed to change a points cap mid-cycle?

---

# Automatic overnight behaviour

Members do not press a button for these. They are part of how the chapter stays honest:

- Mark accountability actions **overdue**
- Expire **unanswered access requests** after 14 days
- Recalculate **points**
- Look again for **lead matches**
- Create **monthly dues** on the 1st
- **Purge** old closed/lost client fields after 24 months
- Send the **daily digest** in the morning (when email is configured)

**Review this:** Any of these should be manual instead? Any that should happen instantly rather than overnight?

---

# What the system remembers (in business language)

Not a database list — a picture of the chapter’s memory:

- **People** — name, email, phone, brokerage, chapter, role, active or not, agreement accepted, how they like to be emailed
- **Invitations** — who was asked, as what, by whom, until when, used or pulled back
- **The chapter calendar** — chapters, dues rules, cycles, Nairobi area names, session dates
- **Leads** — the private client file plus the public matching facts (type, area, budget, and so on)
- **Access** — who asked, who approved, who still has the key
- **Matches and private threads**
- **Promises** — pairings, action steps, verification, nudges
- **Attendance**
- **Closed deals** — volume, date, who shares credit, who confirmed, who verified
- **Points** — each award, why, which cycle
- **Money** — each bill and payment, voids, M-Pesa receipts waiting to be matched, statements
- **Lessons** — topics, posts, stars, replies, hidden posts
- **Inbox**
- **Audit** — who did what, without storing the client’s contact in the log
- **Sign-in failures** — for lockout

**Review this:** Anything a chapter must remember that is missing (listings inventory, viewing schedules, commission invoices, training attendance, WhatsApp broadcast groups)?

---

# Hard no’s (on purpose)

These are not forgotten features. They are refusals:

1. No public signup.
2. No Admin (or Lead) skeleton key into another agent’s client file.
3. No client details in email, notifications, or error reports.
4. No “you’re in the chapter so you can see the number.”
5. No reading someone else’s match thread.
6. No verifying your own action or rating your own lesson.
7. No changing your own role or switching yourself off.
8. Chapter Lead cannot mint another Chapter Lead.
9. You only download **your** statements, not another member’s personal ledger.
10. M-Pesa will not auto-attach a payment to a person because the name “looks right.”
11. Files (statements, etc.) are not public links; they are handed out as short-lived downloads.

If you want one of these reversed, that is a **product decision**, not a small tweak.

---

# Numbers you can change without changing the idea

| Default today | Where it shows up |
|---------------|-------------------|
| Invite lasts **14 days** | Joining |
| Password at least **12 characters** | Join, reset |
| **5** failed logins / **15** minutes lockout | Sign-in |
| Match floor **55**, strong **80**, show **10** | Matching |
| Score mix **40 / 30 / 20 / 10** (area, budget, property, timeline) | Matching |
| Access requests **8 / hour** | Privacy |
| Pending access request dies in **14 days** | Privacy |
| Grant lasts until revoked | Privacy |
| Match messages **40 / hour** | Threads |
| Nudge **once / 24 hours** per action, **10 / hour** overall | Accountability |
| Pairings **per cycle** | Accountability |
| Points cap **600**; category caps 180 / 150 / 120 / 90 / 60 | Scoreboard |
| **KES 500,000** of verified volume = 1 production point | Scoreboard |
| Present **20** / late **15** | Attendance points |
| Referral grant first-touch **30** points | Referrals |
| Dues **KES 5,000 / month**, late fine **KES 1,000** | Money |
| Treasurer void window **30 days** | Money |
| Statements **6 / hour** | Reports |
| Client purge after **24 months** closed/lost | Privacy |
| Deal split **75 / 25** | Closing |
| Digest **07:00 Nairobi** | Email |
| Agreement **2026-01** | Join |

---

# Not switched on yet (do not review as live)

| Item | Reality today |
|------|----------------|
| **M-Pesa checkout** | Built, **switched off**. Treasurer records cash/bank/M-Pesa by hand. |
| **Product email** (invites, alerts, digest, statements) | Needs a real sending address and mail provider. Until then, some mail will not leave the building. Password-reset mail is a separate mailbox setup. |
| **CRM sync** | Buttons are visible and disabled. |
| **Reviewer login chips** | Temporary. Remove before real members arrive. |
| **Legal / ODPC** | Registration and lawyer review of the agreement are still human work. The in-app agreement is a short lock-statement, not a full statute policy. |
| **WhatsApp / social card** | The public page has a branded preview image for when the link is shared. |

**Review this:** What must be live on day one of a real Nairobi chapter — M-Pesa, email, CRM, none of those?

---

# Suggested walkthrough for the reviewer

Use the four chips on sign-in, in this order:

1. **Member** — log a dummy lead, see the pool, open Dashboard / Accountability / Forum / Points / Reports / Inbox / Settings. Confirm you **cannot** see another agent’s client name in the pool.
2. **Treasurer** — open Reports, look for Record a contribution and the chapter total. Confirm you **do not** see the Admin menu.
3. **Chapter lead** — open Admin: Members, Sessions, Topics, Pairings, Audit. Confirm you **cannot** open Chapters and Cycles, and **cannot** see client PII on someone else’s lead.
4. **Admin** — open Chapters and dues, Cycles, invite options. Confirm the lock still holds on another member’s client file.

Then answer, in writing:

- What should members do every week that this room does **not** support?
- What does this room do that your chapter would **never** do?
- Which of the **hard no’s** do you want to keep as a promise to members?
- Which **numbers** are wrong for Nairobi (or for the first city you will actually run)?
- What should be **deleted** before real agents arrive (demo chips, CRM teasers, M-Pesa button, something else)?

---

# One-page picture

```
Invite → Agreement → Chapter room

  Dashboard ………… how am I doing this cycle?
  Leads ……………… my clients (private) + chapter pool (redacted) + match
  Access grant …… owner says yes or no
  Match thread …… two owners only
  Accountability … partner promises, someone else verifies
  Forum …………… one lesson this month
  Points …………… 600-cap scoreboard
  Reports ………… my dues and statements
  Inbox …………… the chapter tapping you on the shoulder

Treasurer adds money recording.
Chapter Lead adds people, sessions, partners, topics, verification.
Admin adds cities, cycles, and any role.
Nobody adds a skeleton key to a client file.
```

That is the product as built. Mark it up. What stays, what changes, what is missing, what should never have been here.