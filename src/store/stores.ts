import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import examReducer from './slices/examSlice'
import commentReducer from './slices/commentSlice'
import adminReducer from './slices/adminSlice'
import roadmapReducer from './slices/roadmapSlice'
import adminRoadmapReducer from './slices/adminRoadmapSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    exam: examReducer,
    comments: commentReducer,
    admin: adminReducer,
    adminRoadmaps: adminRoadmapReducer,
    roadmap: roadmapReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
