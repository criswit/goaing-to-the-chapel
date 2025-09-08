# DynamoDB Access Patterns Documentation

## Table of Contents

1. [Overview](#overview)
2. [Primary Access Patterns](#primary-access-patterns)
3. [GSI Access Patterns](#gsi-access-patterns)
4. [Query Performance Requirements](#query-performance-requirements)
5. [Optimization Strategies](#optimization-strategies)
6. [Capacity Planning](#capacity-planning)

## Overview

This document outlines all supported access patterns for the Wedding RSVP System DynamoDB single-table design. Each pattern includes performance requirements, query examples, and optimization strategies.

### Table Design Summary

- **Table Name**: `wedding-rsvp-{environment}`
- **Primary Key**: Composite (PK + SK)
- **Billing Mode**: PAY_PER_REQUEST (On-Demand)
- **Global Secondary Indexes**: 3 (InvitationCodeIndex, EventStatusIndex, AdminDateIndex)

## Primary Access Patterns

### 1. Get Guest by Event and Email

**Use Case**: Retrieve a specific guest's information for an event  
**Frequency**: High (every RSVP form load)  
**Target Latency**: < 50ms

```typescript
// Query Pattern
{
  TableName: 'wedding-rsvp-dev',
  KeyConditionExpression: 'PK = :pk AND SK = :sk',
  ExpressionAttributeValues: {
    ':pk': 'EVENT#wedding-2024',
    ':sk': 'GUEST#john.doe@example.com'
  }
}
```

**Performance Characteristics**:

- Direct key lookup (most efficient)
- Consistent single-digit millisecond response
- No scanning required

### 2. List All Guests for an Event

**Use Case**: Display all invited guests for an event  
**Frequency**: Medium (admin dashboard)  
**Target Latency**: < 200ms for up to 1000 guests

```typescript
// Query Pattern
{
  TableName: 'wedding-rsvp-dev',
  KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
  ExpressionAttributeValues: {
    ':pk': 'EVENT#wedding-2024',
    ':skPrefix': 'GUEST#'
  }
}
```

**Performance Characteristics**:

- Efficient range query on sort key
- Returns all guests in single query (up to 1MB)
- Use pagination for large guest lists

### 3. Get Event Metadata

**Use Case**: Retrieve event details and configuration  
**Frequency**: High (cached after first load)  
**Target Latency**: < 30ms

```typescript
// Query Pattern
{
  TableName: 'wedding-rsvp-dev',
  KeyConditionExpression: 'PK = :pk AND SK = :sk',
  ExpressionAttributeValues: {
    ':pk': 'EVENT#wedding-2024',
    ':sk': 'METADATA'
  }
}
```

**Performance Characteristics**:

- Direct key lookup
- Should be cached at application level
- Minimal data transfer

### 4. Get RSVP Response History

**Use Case**: View all RSVP responses from a guest (audit trail)  
**Frequency**: Low (admin review)  
**Target Latency**: < 100ms

```typescript
// Query Pattern
{
  TableName: 'wedding-rsvp-dev',
  KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
  ExpressionAttributeValues: {
    ':pk': 'EVENT#wedding-2024',
    ':skPrefix': 'RSVP#john.doe@example.com#'
  },
  ScanIndexForward: false  // Most recent first
}
```

**Performance Characteristics**:

- Efficient range query
- Natural time-series ordering
- Limited result set per guest

### 5. Get Guest Group Members

**Use Case**: Retrieve all members of a family/group  
**Frequency**: Medium (group RSVP management)  
**Target Latency**: < 100ms

```typescript
// Query Pattern
{
  TableName: 'wedding-rsvp-dev',
  KeyConditionExpression: 'PK = :pk AND SK = :sk',
  ExpressionAttributeValues: {
    ':pk': 'EVENT#wedding-2024',
    ':sk': 'GROUP#family-smith'
  }
}
```

## GSI Access Patterns

### GSI1: InvitationCodeIndex

#### Lookup Guest by Invitation Code

**Use Case**: Guest enters invitation code to access RSVP form  
**Frequency**: High (initial RSVP access)  
**Target Latency**: < 100ms

```typescript
// Query Pattern
{
  TableName: 'wedding-rsvp-dev',
  IndexName: 'InvitationCodeIndex',
  KeyConditionExpression: 'InvitationCode = :code',
  ExpressionAttributeValues: {
    ':code': 'INVITATION#ABC123'
  },
  Limit: 1
}
```

**Performance Characteristics**:

- Single item lookup via GSI
- Globally unique codes ensure single result
- Consider caching for repeated lookups

### GSI2: EventStatusIndex

#### List Guests by RSVP Status

**Use Case**: View all attending/not attending guests  
**Frequency**: Medium (reporting and planning)  
**Target Latency**: < 300ms

```typescript
// Query Pattern
{
  TableName: 'wedding-rsvp-dev',
  IndexName: 'EventStatusIndex',
  KeyConditionExpression: 'EventStatus = :eventStatus',
  ExpressionAttributeValues: {
    ':eventStatus': 'EVENT#wedding-2024#STATUS#attending'
  },
  ScanIndexForward: false  // Most recently updated first
}
```

**Performance Characteristics**:

- Efficient status filtering
- Pre-computed status grouping
- Supports pagination for large result sets

### GSI3: AdminDateIndex

#### Admin Queries by Date and Status

**Use Case**: Daily RSVP reports, recent activity monitoring  
**Frequency**: Low (daily reports)  
**Target Latency**: < 500ms

```typescript
// Query Pattern
{
  TableName: 'wedding-rsvp-dev',
  IndexName: 'AdminDateIndex',
  KeyConditionExpression: 'EntityType = :type AND begins_with(AdminDate, :datePrefix)',
  ExpressionAttributeValues: {
    ':type': 'ADMIN',
    ':datePrefix': 'DATE#2024-03-15'
  }
}
```

**Performance Characteristics**:

- Optimized for admin reporting
- Projected attributes minimize data transfer
- Date-based partitioning for efficient queries

## Query Performance Requirements

### Response Time SLAs

| Access Pattern         | Target P50 | Target P99 | Max Acceptable |
| ---------------------- | ---------- | ---------- | -------------- |
| Get Guest by Key       | 10ms       | 50ms       | 100ms          |
| List Event Guests      | 50ms       | 200ms      | 500ms          |
| Invitation Code Lookup | 20ms       | 100ms      | 200ms          |
| Status Filtering       | 100ms      | 300ms      | 1000ms         |
| Admin Reports          | 200ms      | 500ms      | 2000ms         |

### Throughput Requirements

| Access Pattern  | Expected RPS | Peak RPS | Scaling Strategy         |
| --------------- | ------------ | -------- | ------------------------ |
| Guest Lookup    | 100          | 500      | On-demand scaling        |
| RSVP Submission | 10           | 50       | Write sharding if needed |
| Status Queries  | 20           | 100      | GSI auto-scaling         |
| Admin Queries   | 5            | 20       | Result caching           |

## Optimization Strategies

### 1. Caching Strategy

```typescript
// Application-level caching
const cacheConfig = {
  eventMetadata: {
    ttl: 3600, // 1 hour
    strategy: 'write-through',
  },
  invitationLookup: {
    ttl: 300, // 5 minutes
    strategy: 'read-through',
  },
  guestLists: {
    ttl: 60, // 1 minute
    strategy: 'lazy-refresh',
  },
};
```

### 2. Query Optimization

#### Projection Expressions

```typescript
// Minimize data transfer
{
  ProjectionExpression: 'guest_name, email, rsvp_status, plus_ones_count',
  // Only fetch required attributes
}
```

#### Batch Operations

```typescript
// Batch get for multiple guests
{
  RequestItems: {
    'wedding-rsvp-dev': {
      Keys: [
        { PK: 'EVENT#wedding-2024', SK: 'GUEST#user1@example.com' },
        { PK: 'EVENT#wedding-2024', SK: 'GUEST#user2@example.com' }
      ]
    }
  }
}
```

### 3. Write Optimization

#### Conditional Writes

```typescript
// Prevent overwrites
{
  ConditionExpression: 'attribute_not_exists(PK)',
  // Ensures item doesn't exist
}
```

#### Optimistic Locking

```typescript
// Version-based updates
{
  ConditionExpression: 'version = :currentVersion',
  UpdateExpression: 'SET version = :newVersion, ...',
  ExpressionAttributeValues: {
    ':currentVersion': 1,
    ':newVersion': 2
  }
}
```

## Capacity Planning

### Storage Estimates

| Entity Type     | Avg Size  | Count | Total Storage |
| --------------- | --------- | ----- | ------------- |
| Guest           | 500 bytes | 500   | 250 KB        |
| Event           | 1 KB      | 5     | 5 KB          |
| RSVP Response   | 400 bytes | 1000  | 400 KB        |
| Invitation Code | 200 bytes | 500   | 100 KB        |
| Guest Group     | 600 bytes | 50    | 30 KB         |
| **Total**       | -         | -     | **~785 KB**   |

### Cost Optimization

#### On-Demand Pricing (Recommended)

- **Reads**: $0.25 per million read request units
- **Writes**: $1.25 per million write request units
- **Storage**: $0.25 per GB-month

#### Estimated Monthly Costs

```
Assumptions:
- 500 guests
- 10,000 read requests/day
- 1,000 write requests/day

Monthly Costs:
- Reads: 300,000 * $0.25/1M = $0.08
- Writes: 30,000 * $1.25/1M = $0.04
- Storage: 0.001 GB * $0.25 = $0.00
- Total: ~$0.12/month
```

### Scaling Considerations

1. **Partition Key Design**: EVENT# prefix ensures even distribution
2. **Hot Partition Mitigation**: Use write sharding for high-traffic events
3. **GSI Scaling**: Independent throughput scaling for each GSI
4. **Burst Capacity**: DynamoDB provides burst capacity for traffic spikes

## Monitoring and Alerting

### Key Metrics to Monitor

```typescript
// CloudWatch Metrics
const metricsToMonitor = {
  UserErrors: {
    threshold: 10,
    period: '5 minutes',
    alarm: 'High error rate detected',
  },
  ConsumedReadCapacityUnits: {
    threshold: 1000,
    period: '1 minute',
    alarm: 'High read consumption',
  },
  SuccessfulRequestLatency: {
    threshold: 100, // ms
    period: '1 minute',
    alarm: 'High latency detected',
  },
};
```

### Query Performance Logging

```typescript
// Application-level performance tracking
interface QueryMetrics {
  pattern: string;
  latency: number;
  itemCount: number;
  consumedCapacity?: number;
}

function logQueryPerformance(metrics: QueryMetrics) {
  if (metrics.latency > 100) {
    console.warn(`Slow query detected: ${metrics.pattern} took ${metrics.latency}ms`);
  }
}
```

## Best Practices Summary

1. **Always use Query over Scan** - Design access patterns to avoid table scans
2. **Implement caching** - Cache frequently accessed, slowly changing data
3. **Use batch operations** - Reduce API calls for multiple items
4. **Monitor performance** - Track query latencies and optimize slow patterns
5. **Plan for growth** - Design can handle 10x current load
6. **Use consistent naming** - Follow snake_case for attributes
7. **Implement retry logic** - Handle throttling gracefully
8. **Version control** - Use optimistic locking for critical updates
