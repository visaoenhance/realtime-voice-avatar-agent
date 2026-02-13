# Chat Flow Testing Logs

**Purpose**: Document user experience patterns in AI SDK vs LiveKit implementations for comparison and improvement opportunities.

---

## AI SDK Implementation Testing

### Session 1: Caribbean Food Order (2026-02-13)

**User Profile Loaded**:
- Favorites: thai, indian, caribbean
- Dietary: healthy, high-protein  
- Budget: standard, spice: medium
- Note: "Prefers options that arrive under 40 minutes"

**Flow Observations**:

#### 1. Search Filtering Issue
- **User Request**: "Let's go with Caribbean and I am in Orlando"
- **Tool Call**: `searchRestaurants` with filters: cuisine="Caribbean", dietaryTags=["healthy", "high-protein"], closesWithinMinutes=40
- **Result**: No restaurants found
- **User Follow-up**: "Which restaurants are open?"
- **Tool Call**: `searchRestaurants` with filters: cuisine="Caribbean" (removed dietary tags)
- **Result**: Found 1 restaurant (Island Breeze Caribbean)

**Finding**: Dietary tag filtering may be too restrictive. When no results found with dietary tags, system doesn't automatically retry without them or suggest alternatives.

#### 2. Multiple Item Cart Addition
- **User Request**: "Let's order their coconut shrimp and their jerk chicken"
- **System Response**: Called `addItemToCart` twice successfully
- **UI Display**: Showed both additions ("Added to Cart 1 × Coconut Shrimp $12.50" + "Added to Cart 1 × Jerk Chicken $18.95")
- **Speech Summary Issue**: Only announced the last item added ("Added 1 Jerk Chicken to your cart. Subtotal is now $18.95")
- **Cart State Issue**: When asked "Can you tell me what's in the cart?", `viewCart` only showed Coconut Shrimp ($12.50), missing the Jerk Chicken
- **Expected**: Should announce both items and maintain both in cart state

**Finding**: Multi-item requests have multiple issues:
1. Speech response only covers final item, missing comprehensive confirmation
2. Cart state inconsistency - items added successfully but not persisted together
3. Tool created separate cart IDs (9bd8cf23... and 8e7ae9cf...) suggesting session cart management problem

#### 3. Tool Call Pattern
- Profile loading worked correctly with comprehensive context
- Menu display showed proper formatting and categorization  
- Cart functionality worked but created separate cart IDs (potential issue?)
- Multiple restaurant data calls suggesting some redundancy

---

## LiveKit Implementation Testing

### Session 1: Voice Functionality Implementation (2026-02-13)

**Implementation Status**:
- ✅ LiveKit Cloud connection and room management  
- ✅ Voice capture using `useAudioTranscription` (same as AI SDK)
- ✅ Natural language response generation for all demo scenarios
- ✅ WebRTC transport layer for real-time communication
- ✅ Consistent UI/design matching AI SDK version

**Voice Functionality Added**:
- **Microphone Capture**: Integrated `useAudioTranscription` hook (same technology as AI SDK)
- **Speech-to-Text**: Routes through `/api/openai/transcribe` (identical to AI SDK)
- **Natural Conversations**: Agent responds conversationally to voice input
- **Recording Button**: "Start Recording" / "Stop Recording" functionality

**Ready for Testing**: 
Users can now visit `http://localhost:3001/food/concierge-livekit`, connect to LiveKit room, and use voice input exactly like the AI SDK version.

---

## Pattern Analysis

### AI SDK Characteristics Observed:
1. **Strict filtering** - doesn't fallback gracefully when no results
2. **Literal speech summaries** - reports last action rather than session context
3. **Cart management issues** - creates separate cart IDs for multi-item requests, items don't persist together
4. **Tool redundancy** - multiple calls to same data sources
5. **UI vs backend inconsistency** - UI shows both items added, but cart state only retains one
6. **Successful core flow** - profile → search → menu → cart → order path works for single items

### Improvement Opportunities:
1. **Smart fallback filtering** - retry searches with relaxed constraints
2. **Contextual speech summaries** - "Added coconut shrimp and jerk chicken, total $31.45"
3. **Fix cart session management** - ensure multi-item requests use single cart, items persist correctly
4. **Proactive suggestions** - "No healthy options found, would you like to see all Caribbean restaurants?"
5. **UI/backend consistency** - ensure viewCart reflects all successfully added items

---

## Testing Scenarios for LiveKit Comparison

### Test Case 1: Dietary Filter Fallback
**Prompt**: "Find me healthy Caribbean food in Orlando"
**Expected**: Should gracefully handle no results and offer alternatives

### Test Case 2: Multi-item Ordering  
**Prompt**: "I want coconut shrimp and jerk chicken"
**Follow-up**: "What's in my cart?"
**Expected**: Should confirm both items in natural conversation AND maintain both items in cart state

### Test Case 3: Cheesecake Demo Scenario
**Prompt**: "I want cheesecake for my wife, no chocolate"
**Expected**: Should find Island Breeze's "Tropical Coconut Cheesecake" with no-chocolate tag

### Test Case 4: Order Completion
**Prompt**: "Place my order"
**Expected**: Should complete checkout process naturally

---

## Session Context Notes

- Database contains full menus for 7 restaurants including Island Breeze Caribbean
- Cheesecake demo items available: Island Breeze (no-chocolate) vs Harvest & Hearth (with chocolate)
- Cart system functional but may need session optimization
- Voice synthesis working with `speechSummary` fields

*Last Updated: 2026-02-13*