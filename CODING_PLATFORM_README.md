# Code Practice Platform

Một nền tảng luyện code tương tác được xây dựng với React và Monaco Editor, lấy cảm hứng từ HackerRank và LeetCode.

## ✨ Tính năng chính

### 🎯 Coding Practice
- **Problem List**: Danh sách các bài tập lập trình với độ khó khác nhau
- **Problem Description**: Mô tả chi tiết bài tập, ví dụ, và ràng buộc
- **Multi-language Support**: Hỗ trợ C++, Python, JavaScript
- **Monaco Editor**: Code editor mạnh mẽ với syntax highlighting
- **Test Cases**: Chạy test cases và xem kết quả
- **Run & Submit**: Chạy code và submit bài tập

### 🎨 Giao diện
- **Dark Theme**: Giao diện tối hiện đại
- **Responsive Design**: Tương thích với mọi thiết bị
- **HackerRank/LeetCode Style**: Giao diện quen thuộc với developers

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js 16+
- npm hoặc yarn

### Cài đặt dependencies
```bash
cd my-react-app
npm install
```

### Chạy ứng dụng
```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:5173`

## 📁 Cấu trúc dự án

```
src/
├── components/
│   ├── coding/           # Components cho coding practice
│   │   ├── CodeEditor.tsx
│   │   ├── ProblemPanel.tsx
│   │   ├── Sidebar.tsx
│   │   └── TestCasesPanel.tsx
│   └── Layout/           # Layout components
├── data/
│   └── problems.ts       # Dữ liệu bài tập
├── pages/
│   ├── coding/           # Trang coding practice
│   └── dashboard/        # Trang dashboard
├── layouts/
│   └── MainLayout.tsx    # Layout chính
└── routes/
    └── index.ts          # Cấu hình routing
```

## 🎮 Cách sử dụng

### 1. Dashboard
- Truy cập trang chủ để xem tổng quan
- Click "Start Coding" để vào trang luyện code

### 2. Coding Practice
- **Chọn bài tập**: Click vào bài tập trong sidebar bên trái
- **Chọn ngôn ngữ**: Sử dụng dropdown để chọn C++, Python, hoặc JavaScript
- **Viết code**: Sử dụng Monaco Editor để viết code
- **Chạy test**: Click "Run Code" để chạy test cases
- **Submit**: Click "Submit Code" để submit bài tập

### 3. Test Cases
- Xem test cases trong tab "Test Cases"
- Xem kết quả chạy code trong tab "Output"
- Mỗi test case hiển thị input, expected output, và actual output

## 🛠️ Công nghệ sử dụng

- **React 19**: UI framework
- **TypeScript**: Type safety
- **Monaco Editor**: Code editor
- **React Router**: Client-side routing
- **SCSS**: Styling
- **Vite**: Build tool

## 📝 Bài tập mẫu

### 1. Solve Me First (Easy)
Tính tổng của hai số nguyên.

### 2. Valid Palindrome (Easy)
Kiểm tra xem một chuỗi có phải là palindrome không.

### 3. Two Sum (Easy)
Tìm hai số trong mảng có tổng bằng target.

## 🎨 Customization

### Thêm bài tập mới
Chỉnh sửa file `src/data/problems.ts` để thêm bài tập mới:

```typescript
{
  id: 'new-problem',
  title: 'New Problem',
  difficulty: 'Easy',
  category: 'Array',
  description: 'Problem description...',
  examples: [...],
  constraints: [...],
  functionSignature: {
    'cpp': 'int newFunction(int a)',
    'python': 'def newFunction(a):',
    'javascript': 'function newFunction(a)'
  },
  testCases: [...]
}
```

### Thêm ngôn ngữ mới
1. Cập nhật `getLanguageId` trong `CodeEditor.tsx`
2. Thêm template code trong `getDefaultCode`
3. Cập nhật function signature trong dữ liệu bài tập

## 🔧 Development

### Scripts có sẵn
- `npm run dev`: Chạy development server
- `npm run build`: Build production
- `npm run lint`: Chạy ESLint
- `npm run type-check`: Kiểm tra TypeScript

### Cấu trúc component
Mỗi component được tổ chức theo pattern:
- Component.tsx: Logic và JSX
- Component.scss: Styling
- Component.test.tsx: Tests (optional)

## 🚀 Deployment

### Build cho production
```bash
npm run build
```

### Deploy lên Vercel/Netlify
1. Connect repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Deploy

## 📄 License

MIT License - Xem file LICENSE để biết thêm chi tiết.

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📞 Support

Nếu có vấn đề hoặc câu hỏi, vui lòng tạo issue trên GitHub repository.
