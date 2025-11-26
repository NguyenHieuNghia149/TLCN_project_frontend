# Redux State Management Guide - My React App

## 📚 Giới thiệu Redux

Redux là một thư viện quản lý state dự báo được (predictable state management) giúp quản lý dữ liệu toàn cầu (global state) của ứng dụng.

### Lợi ích của Redux:
- **Single source of truth**: Tất cả state được lưu trong một store duy nhất
- **Dễ debug**: Có thể track được tất cả thay đổi state
- **Scalable**: Dễ mở rộng khi app phức tạp
- **Predictable**: State thay đổi theo quy luật

---

## 🏗️ Cấu trúc Redux trong Dự án

### 1. **Store** (`src/store/stores.ts`)

```typescript
import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,  // Đăng ký reducer cho phần auth
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

**Store** là một object chứa toàn bộ state của app:
- `auth`: Quản lý thông tin đăng nhập, đăng ký, phiên làm việc
- Có thể thêm `exam`, `challenge`, `user`, v.v. khi cần

### 2. **Slices** - Các slice quản lý từng phần state

Dự án sử dụng **Redux Toolkit** (cách viết Redux hiện đại). Mỗi slice bao gồm:

#### **A. authSlice.ts** - Quản lý Authentication

**State structure:**
```typescript
interface AuthState {
  session: {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
  }
  login: {
    isLoading: boolean
    error: string | null
    fieldErrors: Record<string, string>
    lastAttempt: LoginCredentials | null
  }
  register: {
    isLoading: boolean
    isOtpSent: boolean
    otpCooldown: number
    error: string | null
    fieldErrors: Record<string, string>
    registrationEmail: string | null
    step: 'register' | 'verify-otp'
    pendingRegistration: PendingRegistration | null
  }
}
```

**Các actions chính:**

1. **initializeSession** (Async Thunk)
   - Làm: Kiểm tra xem user đã đăng nhập hay chưa
   - Khi nào: Ứng dụng khởi động
   - Kết quả: Cập nhật `session.user` nếu đã đăng nhập

2. **loginUser** (Async Thunk)
   - Làm: Gửi email + password đến server
   - Khi nào: User click nút "Login"
   - Kết quả: Lưu token & user info vào state

3. **registerUser** (Async Thunk)
   - Làm: Gửi dữ liệu đăng ký đến server
   - Khi nào: User click "Register"
   - Kết quả: Gửi OTP hoặc tạo tài khoản

4. **clearLoginError** (Synchronous Action)
   - Làm: Xóa lỗi login
   - Khi nào: User thay đổi input

#### **B. examSlice.ts** - Quản lý Exam

**State structure:**
```typescript
interface ExamState {
  exams: Exam[]
  currentExam: Exam | null
  submissions: ExamSubmission[]
  currentSubmission: ExamSubmission | null
  isLoading: boolean
  error: string | null
  statistics: ExamStatistics | null
}
```

**Các actions:**
- `setExams`: Lưu danh sách tất cả bài thi
- `setCurrentExam`: Lưu bài thi hiện tại
- `addSubmission`: Thêm 1 bài nộp mới
- `setStatistics`: Lưu thống kê

---

## 🔌 Cách sử dụng Redux trong Components

### 1. **Lấy dữ liệu từ Redux (useSelector)**

```tsx
import { useSelector } from 'react-redux'
import { RootState } from '../../../store/stores'

const Login: React.FC = () => {
  // Lấy dữ liệu từ store
  const { isLoading, error, fieldErrors } = useSelector(
    (state: RootState) => state.auth.login
  )

  return (
    <div>
      {error && <Alert message={error} type="error" />}
      <button disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </div>
  )
}
```

**Cách hoạt động:**
- `useSelector` là một hook giúp lấy dữ liệu từ Redux store
- Mỗi khi state thay đổi, component sẽ được re-render
- Giống như useState nhưng dữ liệu lưu ở Redux

### 2. **Thay đổi dữ liệu (useDispatch)**

```tsx
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../../../store/stores'
import { loginUser, clearLoginError } from '../../../store/slices/authSlice'

const Login: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()

  // Xóa lỗi khi user gõ
  const handleInputChange = () => {
    dispatch(clearLoginError())
  }

  // Gửi form đăng nhập
  const handleSubmit = async (credentials: LoginCredentials) => {
    const result = await dispatch(loginUser(credentials))
    if (result.meta.requestStatus === 'fulfilled') {
      navigate('/home')
    }
  }

  return (
    <input onChange={handleInputChange} />
  )
}
```

**Cách hoạt động:**
- `dispatch` là một hàm để trigger actions
- Actions thay đổi state trong Redux
- Component tự động re-render khi state thay đổi

### 3. **Async Thunks - Gọi API**

```typescript
// Định nghĩa
export const loginUser = createAsyncThunk<
  { accessToken: string; refreshToken: string },
  LoginCredentials,
  { rejectValue: ErrorPayload }
>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials)
      return response
    } catch (error) {
      return rejectWithValue(error)
    }
  }
)

// Xử lý kết quả trong reducers
extraReducers: (builder) => {
  builder
    .addCase(loginUser.pending, (state) => {
      state.login.isLoading = true
      state.login.error = null
    })
    .addCase(loginUser.fulfilled, (state, action) => {
      state.login.isLoading = false
      state.session.isAuthenticated = true
    })
    .addCase(loginUser.rejected, (state, action) => {
      state.login.isLoading = false
      state.login.error = action.payload?.message || 'Unknown error'
    })
}
```

---

## 🔄 Luồng dữ liệu trong Redux

```
┌─────────────────────────────────────────────────────────┐
│                     Redux Flow                          │
└─────────────────────────────────────────────────────────┘

1. Component gọi dispatch(action)
           ↓
2. Store nhận action
           ↓
3. Reducer xử lý logic, thay đổi state
           ↓
4. Store cập nhật state mới
           ↓
5. Tất cả component sử dụng state đó re-render
           ↓
6. UI cập nhật theo state mới
```

### Ví dụ cụ thể - Login Flow:

```
User nhập email & password
        ↓
User click "Login" button
        ↓
dispatch(loginUser({ email, password }))
        ↓
authService.login() gọi API backend
        ↓
Response từ server (token + user info)
        ↓
loginUser.fulfilled → cập nhật state.auth.session
        ↓
useSelector detect thay đổi → re-render Login component
        ↓
isAuthenticated = true → navigate('/home')
```

---

## 💡 Các Pattern Thường Dùng

### 1. **Xử lý Loading State**

```tsx
const { isLoading, error } = useSelector(
  (state: RootState) => state.auth.login
)

return (
  <button disabled={isLoading}>
    {isLoading ? <Spinner /> : 'Login'}
  </button>
)
```

### 2. **Xử lý Error Messages**

```tsx
const { error, fieldErrors } = useSelector(
  (state: RootState) => state.auth.login
)

return (
  <>
    {error && <Alert message={error} type="error" />}
    {fieldErrors.email && (
      <span className="error">{fieldErrors.email}</span>
    )}
  </>
)
```

### 3. **Conditional Rendering dựa trên State**

```tsx
const { isAuthenticated } = useSelector(
  (state: RootState) => state.auth.session
)

return isAuthenticated ? <Dashboard /> : <Login />
```

### 4. **Multiple useSelector**

```tsx
const sessionState = useSelector(
  (state: RootState) => state.auth.session
)
const loginState = useSelector(
  (state: RootState) => state.auth.login
)

// Hoặc dùng shallowEqual để tối ưu
import { useSelector, shallowEqual } from 'react-redux'
const { isLoading, error } = useSelector(
  (state: RootState) => ({
    isLoading: state.auth.login.isLoading,
    error: state.auth.login.error,
  }),
  shallowEqual
)
```

---

## 🛠️ Cách Thêm Slice Mới

Nếu muốn quản lý state cho `Challenge`, `Lesson`, v.v.:

### 1. Tạo file `src/store/slices/challengeSlice.ts`

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface ChallengeState {
  challenges: Challenge[]
  currentChallenge: Challenge | null
  isLoading: boolean
  error: string | null
}

const initialState: ChallengeState = {
  challenges: [],
  currentChallenge: null,
  isLoading: false,
  error: null,
}

const challengeSlice = createSlice({
  name: 'challenge',
  initialState,
  reducers: {
    setChallenges: (state, action: PayloadAction<Challenge[]>) => {
      state.challenges = action.payload
    },
    setCurrentChallenge: (state, action: PayloadAction<Challenge>) => {
      state.currentChallenge = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
  },
})

export const { setChallenges, setCurrentChallenge, setLoading, setError } =
  challengeSlice.actions
export default challengeSlice.reducer
```

### 2. Đăng ký vào Store (`src/store/stores.ts`)

```typescript
import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import challengeReducer from './slices/challengeSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    challenge: challengeReducer,  // ← Thêm dòng này
  },
})
```

### 3. Sử dụng trong Component

```tsx
const dispatch = useDispatch<AppDispatch>()
const { challenges, isLoading } = useSelector(
  (state: RootState) => state.challenge
)

// Dispatch action
dispatch(setChallenges(data))
```

---

## 📊 Redux DevTools (Debug)

Redux Toolkit tự động hỗ trợ Redux DevTools. Bạn có thể:

1. Cài đặt [Redux DevTools extension](https://chrome.google.com/webstore/detail/redux-devtools) cho Chrome
2. Mở DevTools (F12) → Redux tab
3. Xem tất cả actions được dispatch
4. Time-travel debug (quay lại state trước đó)

---

## ⚠️ Lưu ý quan trọng

### 1. **Immutability**
Redux không cho phép thay đổi state trực tiếp. Redux Toolkit sử dụng Immer nên có thể viết code giống mutate:

```typescript
// ✅ Đúng - Redux Toolkit sẽ xử lý
reducers: {
  updateUser: (state, action) => {
    state.user.name = action.payload.name
  }
}

// ❌ Sai - Thay đổi trực tiếp
state.user = { ...action.payload }
```

### 2. **Selector Performance**
```typescript
// ⚠️ Tạo object mới mỗi lần render → re-render không cần
const data = useSelector(state => ({
  isLoading: state.auth.login.isLoading,
  error: state.auth.login.error,
}))

// ✅ Dùng shallowEqual để tối ưu
const data = useSelector(
  state => ({
    isLoading: state.auth.login.isLoading,
    error: state.auth.login.error,
  }),
  shallowEqual
)
```

### 3. **Async Thunks**
Luôn handle 3 case: `pending`, `fulfilled`, `rejected`

```typescript
builder
  .addCase(loginUser.pending, (state) => {
    state.isLoading = true
  })
  .addCase(loginUser.fulfilled, (state, action) => {
    state.isLoading = false
    state.user = action.payload
  })
  .addCase(loginUser.rejected, (state, action) => {
    state.isLoading = false
    state.error = action.payload
  })
```

---

## 🎓 Tóm tắt

| Khái niệm | Giải thích | Ví dụ |
|-----------|-----------|-------|
| **Store** | Kho lưu tất cả state | `store.getState()` |
| **Slice** | Phần quản lý một feature | `authSlice`, `examSlice` |
| **Reducer** | Hàm thay đổi state | `loginUser`, `clearError` |
| **Action** | Đối tượng mô tả sự thay đổi | `{ type: 'auth/login', payload: {...} }` |
| **Dispatch** | Gửi action đến store | `dispatch(loginUser(data))` |
| **Selector** | Lấy dữ liệu từ store | `useSelector(state => state.auth)` |

---

## 📚 Tham khảo thêm

- [Redux Documentation](https://redux.js.org)
- [Redux Toolkit](https://redux-toolkit.js.org)
- [React-Redux Hooks](https://react-redux.js.org/api/hooks)
