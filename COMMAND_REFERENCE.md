# Command Reference - Skills Nomenclature

## Naming Convention: Direct Skill Names (Intuitive & Scalable)

### Core Pillars (4 skills)

| Commande | Skill | Description |
|----------|-------|-------------|
| `/foundations` | Foundations | Mission, Vision, Valeurs personnelles, Proposition de valeur |
| `/analytics` | Analytics Pro | GA4, Facebook Analytics, Funnel analysis, Cohort, Attribution |
| `/trading` | Trading Pro | Macro analysis, Technical analysis, Day/Swing/Position trading |
| `/hooks` | Hooks | Frameworks psychologiques universels, Persuasion, Behavioral design |

### Marketing Skills (11-12 skills)

| Commande | Skill | Description |
|----------|-------|-------------|
| `/copywriting` | Copywriting | Sales pages, Headlines, Email sequences, Ad copy |
| `/blogging` | Blogging | Content strategy, SEO optimization, Structure |
| `/youtube` | YouTube Strategy | Channel optimization, Script structure, Thumbnails, Analytics |
| `/funnel` | Funnel Architecture | Product launches, Conversion sequences, Customer journey |
| `/seo` | SEO Mastery | Keyword research, Technical SEO, Link building |
| `/social` | Social Media | Content calendar, Platform-specific strategy, Engagement |
| `/email` | Email Marketing | Sequences, Automation, Segmentation, Deliverability |
| `/content` | Content Marketing | Storytelling, Thought leadership, Distribution strategy |
| `/video` | Video Production | Script writing, Editing, Distribution, Repurposing |
| `/ads` | Paid Advertising | Facebook/Google Ads strategy, Bidding, Creative testing |
| `/product` | Product Strategy | Launch strategy, Positioning, Market fit |
| `/community` | Community Building | Engagement strategy, Loyalty, Retention |

## Usage Examples

```bash
# Strategic foundations
/foundations mission
/foundations vision
/foundations values

# Financial analysis
/analytics ga4
/analytics facebook-ads
/trading macro
/trading technical

# Content creation
/copywriting headlines
/blogging seo-strategy
/youtube thumbnails
/content storytelling

# Execution
/email sequences
/ads creative-testing
/funnel optimization
/social calendar
```

## Implementation Patterns

### Single Word (Direct Invocation)
```
/foundations → Load full Foundations skill
/analytics → Load full Analytics Pro skill
/trading → Load full Trading Pro skill
```

### Sub-parameters (Optional Enhancement)
```
/analytics ga4
/analytics facebook
/trading macro
/trading technical
/copywriting headlines
/copywriting email
```

## Why This Convention?

✅ **Intuitive** - Skill name matches command name  
✅ **Scalable** - Easily add 15-16+ skills  
✅ **Memorable** - No cryptic abbreviations  
✅ **Consistent** - Same naming across dashboard, CLI, API  
✅ **Searchable** - Easy to find in help/documentation  
✅ **Professional** - Clear for team collaboration  

## Dashboard Integration

Each skill button in Streamlit matches its command:
- Button "Foundations" → Runs `/foundations`
- Button "Analytics" → Runs `/analytics`
- Button "Trading" → Runs `/trading`
- Button "Copywriting" → Runs `/copywriting`
- etc.

---

**Last updated:** 2026-07-22  
**Version:** 1.0  
**Next review:** 2026-12-22
