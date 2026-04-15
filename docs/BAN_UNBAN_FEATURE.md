# Frontend User Ban/Unban Feature Guide

## Redux Store Integration

### State Structure

The admin slice manages ban-related operations:

```typescript
admin: {
  bannedUsers: {
    list: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      status: 'banned';
      banReason: string;
      bannedAt: string;
      bannedByAdmin?: {
        id: string;
        name: string;
      };
    }>;
    total: number;           // Total banned users count
    limit: number;           // Current page size
    offset: number;          // Current pagination offset
    loading: boolean;        // Loading state for fetch
    error: string | null;    // Error from fetch
  };
  banOperation: {
    loading: boolean;        // Loading state for ban/unban
    error: string | null;    // Error from operation
    success: boolean;        // Was last operation successful
  };
}
```

### Available Async Thunks

#### asyncBanUser
Bans a user with a reason.

```typescript
dispatch(asyncBanUser({ userId: string, reason: string }))
  .then((action) => {
    if (action.type === asyncBanUser.fulfilled.type) {
      console.log('User banned successfully');
    }
  });
```

**States:**
- `pending`: Ban operation in progress
- `fulfilled`: User successfully banned
- `rejected`: Ban operation failed

**Error Handling:**
- Invalid reason: Returns error message about character limits
- Already banned: Returns error about user status
- Permission denied: Returns 403 error
- Network error: Returns network error message

#### asyncUnbanUser
Unbans a currently banned user.

```typescript
dispatch(asyncUnbanUser(userId: string))
  .then((action) => {
    if (action.type === asyncUnbanUser.fulfilled.type) {
      console.log('User unbanned successfully');
    }
  });
```

#### asyncFetchBannedUsers
Fetches paginated list of banned users.

```typescript
dispatch(asyncFetchBannedUsers({ 
  limit: number; 
  offset: number 
}))
  .then((action) => {
    if (action.type === asyncFetchBannedUsers.fulfilled.type) {
      // List now available in state.admin.bannedUsers.list
    }
  });
```

### Available Actions

#### clearBanError
Clears the error state from last ban/unban operation.

```typescript
dispatch(clearBanError());
```

### setPaginationParams
Updates pagination settings for banned users list.

```typescript
dispatch(setPaginationParams({ 
  limit: 20,  // Items per page
  offset: 40  // Skip first N items
}));
```

## Component Usage

### BanUserModal Component

Modal dialog for banning a user with reason input.

**Props:**
```typescript
interface BanUserModalProps {
  isOpen: boolean;                    // Show/hide modal
  userId?: string;                    // User ID to ban
  userName?: string;                  // User name for display
  onClose: () => void;                // Callback when modal closes
  onSuccess?: () => void;             // Callback on successful ban
}
```

**Example Usage:**
```typescript
const [isBanModalOpen, setIsBanModalOpen] = useState(false);
const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);

return (
  <>
    <button onClick={() => {
      setSelectedUser({ id: 'user-123', name: 'John Doe' });
      setIsBanModalOpen(true);
    }}>
      Ban User
    </button>

    <BanUserModal
      isOpen={isBanModalOpen}
      userId={selectedUser?.id}
      userName={selectedUser?.name}
      onClose={() => {
        setIsBanModalOpen(false);
        setSelectedUser(null);
      }}
      onSuccess={() => {
        // Refresh data
        dispatch(asyncFetchBannedUsers({ limit: 20, offset: 0 }));
      }}
    />
  </>
);
```

**Features:**
- Validates reason length: 10-500 characters
- Shows character count: "0/500"
- Real-time validation feedback
- Loading state during submit
- Error display
- Disabled state for valid submission

### BannedUsersList Component

Table displaying all currently banned users with pagination.

**Props:** None (uses Redux state directly)

**Example Usage:**
```typescript
import { BannedUsersList } from '@/components/admin/BannedUsersList';

export function AdminDashboard() {
  return (
    <div className="p-6">
      <h2>Banned Users</h2>
      <BannedUsersList />
    </div>
  );
}
```

**Features:**
- Paginated table (20 items per page by default)
- Shows: Name, Email, Ban Reason, Ban Date, Banning Admin
- Unban button for each user
- Previous/Next page navigation
- Current page counter
- Loading indicator
- Error display
- Empty state message

**Column Details:**
| Column | Data | Format |
|--------|------|--------|
| User | name, email | Name on first line, email as gray subtext |
| Ban Reason | banReason | Truncated with ellipsis on overflow |
| Banned At | bannedAt | Relative time ("1 day ago") |
| Banned By | bannedByAdmin.name | Admin name or "System" |
| Action | - | Unban button |

### UserManagementPage Component

Main admin page combining active users list and banned users management.

**Props:** None

**Example Usage:**
```typescript
import { UserManagementPage } from '@/pages/Admin/UserManagementPage';

// In routing setup:
<Route path="/admin/users" element={<UserManagementPage />} />
```

**Features:**
- Tab navigation: "Active Users" | "Banned Users"
- Active Users tab:
  - Search bar (searches name and email)
  - Table of active users with Ban button
  - User info: Name, Email, Role, Join Date
  - Loading state

- Banned Users tab:
  - Displays BannedUsersList component
  - Full pagination controls

- BanUserModal integration:
  - Modal for entering ban reason
  - Auto-refresh both lists on successful ban

**Layout:**
```
┌─ User Management Title ─────────────────┐
│                                          │
│  [Active Users] [Banned Users] ← Tabs    │
│                                          │
│  ┌─ Active Users Tab ──────────────────┐ │
│  │ [Search...] [×]                     │ │
│  │ ┌──────────────────────────────────┐│ │
│  │ │ Name │ Email │ Role │ Join │ Act││ │
│  │ │ John │ john@ │ USER │ 1/10 │Ban││ │
│  │ └──────────────────────────────────┘│ │
│  └─────────────────────────────────────┘ │
│                                          │
│  Modal appears when Ban button clicked:  │
│  ┌─ Ban User ───────────────────────────┐│
│  │ Are you sure? [Reason: _______] [×]  ││
│  │ Ban Reason: 10-500 chars             ││
│  │ [Cancel] [Confirm Ban]               ││
│  └─────────────────────────────────────-┘│
└──────────────────────────────────────────┘
```

## Common Implementation Patterns

### Handling Ban Success

```typescript
const handleBanClick = (user) => {
  setSelectedUser({ id: user.id, name: user.name });
  setIsBanModalOpen(true);
};

const handleBanSuccess = () => {
  // Refresh both lists
  dispatch(asyncFetchBannedUsers({ 
    limit: bannedUsers.limit, 
    offset: 0  // Reset to first page
  }));
  
  // Re-fetch active users to remove banned user
  fetchActiveUsers();
};
```

### Pagination Implementation

```typescript
const dispatch = useDispatch();
const { bannedUsers } = useSelector(state => state.admin);

const handlePageChange = (newOffset) => {
  dispatch(setPaginationParams({ 
    limit: bannedUsers.limit, 
    offset: newOffset 
  }));
  
  // This auto-triggers fetch via useEffect watching pagination params
};

const totalPages = Math.ceil(
  bannedUsers.total / bannedUsers.limit
);
const currentPage = Math.floor(
  bannedUsers.offset / bannedUsers.limit
) + 1;
```

### Error Handling

```typescript
const { banOperation } = useSelector(state => state.admin);

if (banOperation.error) {
  return (
    <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
      {banOperation.error}
      <button onClick={() => dispatch(clearBanError())}>
        Dismiss
      </button>
    </div>
  );
}
```

### Loading States

```typescript
const { banOperation, bannedUsers } = useSelector(
  state => state.admin
);

// For modal
if (banOperation.loading) {
  return <button disabled>Banning...</button>;
}

// For list
if (bannedUsers.loading && bannedUsers.list.length === 0) {
  return <div>Loading banned users...</div>;
}
```

## Date Formatting

The component uses `date-fns` for relative time formatting:

```typescript
import { formatDistanceToNow } from 'date-fns';

const bannedTime = formatDistanceToNow(
  new Date(user.bannedAt), 
  { addSuffix: true }
);
// Result: "1 day ago", "2 hours ago", etc.
```

## Styling Approach

Components use Tailwind CSS utility classes:

```typescript
// Modal overlay
className="fixed inset-0 bg-black bg-opacity-50"

// Table cell
className="px-6 py-4 text-sm text-gray-700 border-b"

// Button states
className="disabled:opacity-50 disabled:cursor-not-allowed"

// Color variants
className="bg-red-600 hover:bg-red-700"  // Danger
className="bg-green-600 hover:bg-green-700"  // Success
className="bg-blue-600 hover:bg-blue-700"  // Primary
```

## API Client Integration

Components use the `adminService` from `@/services/api/adminUser.service`:

```typescript
// Service methods called by Redux thunks:
adminService.banUser(userId, reason)
adminService.unbanUser(userId)
adminService.listBannedUsers(limit, offset)
adminService.listActiveUsers()  // For search

// All use apiClient (Axios) with auth interceptor
// Error responses are caught and returned as rejection
```

## Testing Components

### Example: BanUserModal Test

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BanUserModal } from './BanUserModal';

it('validates reason length', () => {
  render(
    <Provider store={mockStore}>
      <BanUserModal
        isOpen={true}
        userId="user-1"
        userName="Test User"
        onClose={() => {}}
      />
    </Provider>
  );

  const reasonInput = screen.getByPlaceholderText(
    /Enter the reason/i
  );
  fireEvent.change(reasonInput, { target: { value: 'short' } });
  
  const confirmBtn = screen.getByText('Confirm Ban');
  expect(confirmBtn).toBeDisabled();
});
```

## Troubleshooting

### Modal doesn't open
- Check `isOpen` prop is true
- Verify `userId` and `userName` are passed
- Check Redux store is initialized

### Ban fails with 403
- Verify logged-in user is ADMIN or OWNER role
- Check if attempting to ban self or another admin
- Review permission requirements

### List doesn't update after ban
- Call `onSuccess` callback on BanUserModal
- Make sure `asyncFetchBannedUsers` is dispatched in onSuccess
- Check Redux middleware is configured

### Display shows "Banning..." forever
- Check network requests in DevTools
- Verify API endpoint returns proper response
- Check for unhandled errors in Redux thunks

## Performance Considerations

- **List pagination**: Limited to 20 items per page to prevent rendering large tables
- **Search debouncing**: Recommended to debounce search input (300ms)
- **Lazy loading**: Banned users list only fetches on tab click
- **Date formatting**: Using `date-fns` with memoization for performance

## Accessibility Features

- Semantic HTML: `<button>`, `<table>`, `<textarea>`
- ARIA labels on modal dialog
- Keyboard navigation: Tab through form fields, Enter to submit
- Focus management: Focus returns to trigger button after modal closes
- Color contrast: WCAG AA compliant

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires:
- ES2020+ support
- CSS Grid and Flexbox
- React 18+
- Redux Toolkit
