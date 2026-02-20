# NomadNotes Match Engine & Discovery System

## Overview
A robust, geospatial-based match discovery system similar to Tantan/Tinder, built with Node.js, MongoDB, and Mongoose.

## Architecture

### Data Models

#### User Model - Geospatial Location
```javascript
geoLocation: {
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    index: '2dsphere'
  }
}
```

**Important**: GeoJSON format requires `[longitude, latitude]` order (not lat/lng).

#### Match Model - Two-Party Single Document
```javascript
{
  user1: ObjectId,        // Always sorted (user1 < user2)
  user2: ObjectId,        // Always sorted
  user1Status: String,    // 'none' | 'like' | 'pass'
  user2Status: String,    // 'none' | 'like' | 'pass'
  matched: Boolean,       // true when both status = 'like'
  matchedAt: Date,        // timestamp of match
  user1Settings: Object,  // user-specific settings
  user2Settings: Object   // user-specific settings
}
```

**Benefits of Two-Party Approach**:
- Single document per user pair (no duplicates)
- Atomic updates with `findOneAndUpdate`
- Efficient queries (one lookup instead of two)
- Consistent ordering prevents race conditions

## API Endpoints

### 1. Discovery Endpoint
**GET** `/api/matches/discover`

**Description**: Returns a stack of 20 potential matches based on location and preferences.

**Authentication**: Required (Bearer token)

**Query Parameters**: None (uses user's stored preferences)

**Response**:
```json
{
  "success": true,
  "count": 20,
  "profiles": [
    {
      "id": "user_id",
      "name": "John Doe",
      "username": "johndoe",
      "profilePicture": "url",
      "bio": "Love traveling!",
      "age": "28",
      "gender": "Male",
      "location": "New York, USA",
      "distance": 5,
      "interests": ["Hiking", "Photography"],
      "travelStyle": "Adventure",
      "languages": ["English", "Spanish"],
      "upcomingTrips": ["Japan 2024"]
    }
  ]
}
```

**Error Responses**:
- `400`: Location not set
- `401`: Unauthorized
- `500`: Server error

**Discovery Algorithm**:
1. **Geospatial Filter**: Uses `$geoNear` to find users within radius (default 50km)
2. **Preference Matching**: Filters by age, gender, travel style, interests
3. **Exclusion Filter**: Removes already-swiped users using `$lookup`
4. **Randomization**: Uses `$sample` to shuffle results
5. **Limit**: Returns maximum 20 profiles

### 2. Swipe Endpoint
**POST** `/api/matches/swipe`

**Description**: Records a like or pass action and checks for mutual matches.

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "targetUserId": "user_id",
  "action": "like" // or "pass"
}
```

**Response (No Match)**:
```json
{
  "success": true,
  "action": "like",
  "matched": false,
  "matchId": "match_document_id"
}
```

**Response (Match!)**:
```json
{
  "success": true,
  "action": "like",
  "matched": true,
  "matchId": "match_document_id",
  "matchedUser": {
    "id": "user_id",
    "name": "Jane Smith",
    "username": "janesmith",
    "profilePicture": "url",
    "bio": "Adventure seeker"
  }
}
```

**Error Responses**:
- `400`: Invalid user ID, invalid action, or self-swipe attempt
- `404`: Target user not found
- `409`: Duplicate swipe (race condition)
- `500`: Server error

**Swipe Logic**:
1. **Validation**: Checks user IDs, action type, prevents self-swipe
2. **ID Sorting**: Ensures consistent user1/user2 ordering
3. **Upsert**: Creates or updates match document atomically
4. **Match Detection**: Checks if both users liked each other
5. **Response**: Returns match status and user info if matched

## Security & Robustness

### ObjectId Validation
All user IDs are validated before database queries:
```javascript
if (!mongoose.Types.ObjectId.isValid(userId)) {
  return res.status(400).json({ error: 'Invalid user ID' });
}
```

This prevents:
- CastError exceptions
- Injection attacks
- Invalid string parameters (e.g., "blocked")

### Race Condition Handling
Uses `findOneAndUpdate` with `upsert: true` for atomic operations:
```javascript
const match = await Match.findOneAndUpdate(
  { user1, user2 },
  { $set: updateObj },
  { upsert: true, new: true }
);
```

Handles duplicate key errors gracefully:
```javascript
if (error.code === 11000) {
  return res.status(409).json({ error: 'Match already exists' });
}
```

### Input Sanitization
- Validates action enum: `['like', 'pass']`
- Prevents self-swiping
- Verifies target user exists
- Checks location data before geospatial queries

## Database Indexes

### Required Indexes
```javascript
// User model
userSchema.index({ 'geoLocation': '2dsphere' });

// Match model
matchSchema.index({ user1: 1, user2: 1 }, { unique: true });
```

### Performance Optimization
- 2dsphere index enables fast geospatial queries
- Compound unique index prevents duplicate matches
- Sparse indexes on optional fields

## Migration & Setup

### 1. Add GeoLocation to Existing Users
```bash
node backend/scripts/addGeoLocationToUsers.js
```

This script:
- Converts existing `coordinates` to `geoLocation` GeoJSON format
- Creates 2dsphere index
- Updates all users with location data

### 2. Update User Location
When user updates location in frontend:
```javascript
// Frontend sends: { lat, lng }
// Backend converts to GeoJSON:
user.geoLocation = {
  type: 'Point',
  coordinates: [lng, lat] // Note: longitude first!
};
```

## Frontend Integration

### Discovery Flow
```javascript
// 1. Fetch potential matches
const response = await fetch('/api/matches/discover', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { profiles } = await response.json();

// 2. Display cards in swipe UI
profiles.forEach(profile => {
  renderCard(profile);
});
```

### Swipe Flow
```javascript
// User swipes right (like)
const response = await fetch('/api/matches/swipe', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    targetUserId: profile.id,
    action: 'like'
  })
});

const { matched, matchedUser } = await response.json();

if (matched) {
  showMatchModal(matchedUser);
}
```

## Match Preferences

Users can customize discovery through `matchPreferences`:

```javascript
matchPreferences: {
  ageRange: [25, 35],              // Age filter
  travelStyles: ['Adventure'],      // Travel style filter
  interests: ['Hiking', 'Food'],    // Common interests
  locationRange: 100,               // Distance in km
  genders: ['Male', 'Female']       // Gender preference
}
```

## Testing

### Test Discovery
```bash
curl -X GET http://localhost:5000/api/matches/discover \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Swipe
```bash
curl -X POST http://localhost:5000/api/matches/swipe \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetUserId": "TARGET_USER_ID",
    "action": "like"
  }'
```

## Performance Considerations

### Geospatial Query Optimization
- Uses `$geoNear` as first stage in aggregation (most efficient)
- Limits results with `maxDistance` parameter
- Projects only necessary fields to reduce data transfer

### Caching Strategy (Future Enhancement)
- Cache discovery results for 5 minutes
- Invalidate cache on user preference changes
- Use Redis for distributed caching

### Scaling Considerations
- Shard by user location (geohash)
- Read replicas for discovery queries
- Write to primary for swipe actions
- Consider separate match service for high traffic

## Error Handling

All endpoints return consistent error format:
```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

Common errors:
- `400`: Bad request (validation failed)
- `401`: Unauthorized (invalid/missing token)
- `404`: Resource not found
- `409`: Conflict (duplicate action)
- `500`: Internal server error

## Monitoring & Logging

Key metrics to track:
- Discovery query latency
- Swipe action success rate
- Match rate (likes that become matches)
- Geospatial query performance
- Cache hit rate (if implemented)

## Future Enhancements

1. **Boost System**: Increase visibility for premium users
2. **Super Likes**: Special like with notification
3. **Rewind**: Undo last swipe
4. **Passport**: Change location temporarily
5. **Smart Photos**: AI-powered photo ordering
6. **Icebreakers**: Suggested conversation starters
7. **Video Profiles**: Short video introductions
8. **Verification**: Blue check for verified users

## Troubleshooting

### "Location not set" Error
- User needs to update location in account settings
- Frontend should prompt for location permission
- Backend converts lat/lng to GeoJSON format

### No Matches Returned
- Check if users exist within radius
- Verify 2dsphere index exists
- Check match preferences aren't too restrictive
- Ensure users have public profiles enabled

### CastError on Swipe
- Validate ObjectId before query
- Check for string parameters like "blocked"
- Ensure proper error handling in routes

## Support

For issues or questions:
- Check logs: `backend/logs/`
- Review error responses
- Test with curl commands
- Verify database indexes
