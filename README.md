# Hướng Dẫn Chạy Local

Dự án gồm hai phần: **ASP.NET Core 8 Web API** trong thư mục `backend/` và **React (Vite + TypeScript)** trong thư mục `frontend/`. Các bước bên dưới giúp bạn thiết lập môi trường và chạy cả hai dịch vụ trên máy local.

## Yêu Cầu Trước Khi Bắt Đầu

- .NET SDK 8.0 trở lên
- Node.js 18 trở lên (npm đi kèm)
- Một instance SQL Server (LocalDB, Docker hoặc Azure SQL)

## Cấu Hình Môi Trường

### Backend (`backend/src/Sales.Api`)

API đọc cấu hình từ `appsettings.json`, `appsettings.Development.json` và các biến môi trường. Khi phát triển, bạn có thể chỉnh `appsettings.Development.json` hoặc set biến môi trường. Những khóa quan trọng:

| Setting | Mô tả |
| --- | --- |
| `ConnectionStrings__DefaultConnection` | Chuỗi kết nối SQL Server dùng cho EF Core. |
| `Jwt__SigningKey` | Khóa bí mật ký JWT (nên dùng chuỗi ngẫu nhiên dài ở môi trường dev). |
| `Jwt__Issuer` / `Jwt__Audience` *(tùy chọn)* | Ghi đè issuer/audience nếu cần. |
| `Database__ApplyMigrations` | `true` để tự chạy migrations khi khởi động. |
| `Database__SeedDemoData` | `true` để seed admin/khách hàng/sản phẩm mẫu phục vụ thử nghiệm. |

> Mẹo: trên PowerShell bạn có thể set biến lồng nhau bằng `setx ConnectionStrings__DefaultConnection "<connection-string>"` hoặc dùng `.env` với [dotnet user-secrets](https://learn.microsoft.com/aspnet/core/security/app-secrets).

### Frontend (`frontend/`)

Tạo file `.env.local` từ `.env.example` để trỏ SPA tới API đang chạy:

```bash
cd frontend
cp .env.example .env.local
# chỉnh .env.local
VITE_API_BASE_URL=http://localhost:5152
```

- Giá trị là URL HTTP mà backend đang lắng nghe (mặc định hiển thị trong log khi chạy Kestrel).
- Nếu gọi backend đã deploy, thay bằng URL công khai tương ứng.

## Chạy Backend

1. Cài dependency (lần đầu tiên):
   ```bash
   cd backend
   dotnet restore
   ```
2. Áp dụng migrations cho database:
   ```bash
   dotnet ef database update --project src/Sales.Api --startup-project src/Sales.Api
   ```
3. Khởi động API:
   ```bash
   dotnet run --project src/Sales.Api --urls http://localhost:5152
   ```
4. Swagger UI: http://localhost:5152/swagger

> Nếu `Database__SeedDemoData=true`, tài khoản admin mặc định là `admin@sales.local` / `Admin@12345`.

## Chạy Frontend

1. Cài dependency Node:
   ```bash
   cd frontend
   npm install
   ```
2. Khởi động Vite dev server:
   ```bash
   npm run dev
   ```
3. Mở URL hiển thị trên terminal (mặc định http://localhost:5173). Ứng dụng sẽ gọi API theo giá trị `VITE_API_BASE_URL`.

## Lệnh Hữu Ích

- **Chạy test backend**: `dotnet test` (nếu có test).
- **Frontend lint/build**:
  ```bash
  npm run build
  npm run preview
  ```
- **Tạo lại database**: `dotnet ef database drop` rồi `dotnet ef database update`, hoặc dùng công cụ SQL bất kỳ.

Sau khi backend và frontend đều chạy, bạn có thể đăng nhập, quản lý khách hàng/sản phẩm và tạo/cập nhật/xóa đơn hàng ngay trên giao diện admin.

### Ghi chú khi triển khai backend

- App Service mặc định không trả về nội dung cho đường dẫn gốc `/` khi bạn chạy Web API. Nếu muốn hiển thị trang mặc định, hãy bổ sung một controller trả về HTML đơn giản hoặc phục vụ file tĩnh từ `wwwroot`.
- Swagger chỉ được bật trong môi trường Development (`app.Environment.IsDevelopment()`). Nếu cần truy cập Swagger trên môi trường thật, bạn có thể bật biến môi trường `ASPNETCORE_ENVIRONMENT=Development` hoặc thêm điều kiện riêng, nhưng hãy cân nhắc rủi ro bảo mật (nên bảo vệ Swagger bằng auth/IP).

## Triển Khai Frontend Lên Azure Storage (Static Website)

1. **Chuẩn bị**
   - Azure Storage Account (đa số gói đều hỗ trợ Static Website, trừ một số SKU cũ).
   - `npm run build` đã tạo thư mục `web-build/` (hoặc `dist/`) chứa bundle.

2. **Bật Static Website**
   - Azure Portal → Storage Account → *Frontend đã chọn* → `Static website` → Enable.
   - `Index document name`: `index.html`.
   - `Error document path`: `index.html` (SPA cần redirect về index khi 404).

3. **Upload bundle**
   - Trong cổng portal chọn **Upload** ở giao diện Static Website → chọn tất cả file trong thư mục build (`web-build/`), upload lên container `$web`.
   - Hoặc dùng Azure CLI:
     ```bash
     az storage blob upload-batch \
       --account-name <account> \
       --destination '$web' \
       --source frontend/web-build
     ```
   - Với CLI, cần cung cấp connection string hoặc đã đăng nhập (`az login`).

4. **Kết nối backend**
   - Đảm bảo `VITE_API_BASE_URL` đã build trỏ về backend (ví dụ `https://<api-app>.azurewebsites.net`).
   - Cấu hình CORS ở backend cho domain Static Website (`https://<account>.z<#>.web.core.windows.net`).

5. **Kiểm tra**
   - Portal hiển thị URL Public (`https://<account>.z<#>.web.core.windows.net`). Mở và kiểm tra SPA gọi API thành công.

> Nếu cần rewrite hoặc cấu hình auth nâng cao, thêm file `staticwebapp.config.json` (không bắt buộc với storage account) hoặc dùng CDN/Azure Front Door.
## Triển Khai Frontend Lên Render

1. Đảm bảo mã nguồn đã được push lên repository mà Render truy cập được (GitHub/GitLab/Bitbucket).
2. Trên Render, chọn **New > Blueprint** và trỏ tới branch chứa file `render.yaml` (hoặc chọn **New > Static Site** nếu muốn cấu hình thủ công).
3. Nếu dùng Blueprint, Render sẽ tạo dịch vụ `sales-frontend` với cấu hình build:
   - Build Command: `npm install && npm run build`
   - Publish directory: `frontend/web-build`
4. Cấu hình biến môi trường `VITE_API_BASE_URL` trong Render để trỏ về backend đã deploy (`https://azurewebsitesduytu-gqgeapagexemdhbr.southeastasia-01.azurewebsites.net/`). Bạn có thể chỉnh sửa giá trị này trong Dashboard > Environment.
5. Triển khai lần đầu và chờ build hoàn tất. Render tự động thiết lập rewrite `/* -> /index.html` nên SPA hoạt động với mọi route.
6. Kiểm tra URL Render cung cấp, xác minh các request API thành công. Đừng quên bật CORS cho domain Render ở backend (nếu backend có chính sách CORS).

> Nếu chọn cấu hình thủ công (Static Site), nhớ nhập đúng build command/publish directory ở bước 3 và thêm mục rewrite `/* -> /index.html` trong phần **Advanced > Redirects/Rewrites**.

