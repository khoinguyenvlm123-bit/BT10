# JWT Spring Boot 3 + Spring Security + Nimbus JOSE + JWT

Project làm lại ví dụ JWT trong bài giảng, nhưng thay thư viện JJWT (`io.jsonwebtoken`) bằng **Nimbus JOSE + JWT** (`com.nimbusds:nimbus-jose-jwt`).

## Chức năng
- Đăng nhập: `POST /auth/login`
- Đăng ký API: `POST /auth/signup`
- Sinh và verify JWT HS256 bằng Nimbus
- Spring Security stateless + `JwtAuthenticationFilter`
- `GET /users/me`: thông tin user hiện tại
- `GET /users`: danh sách user
- Dashboard sau đăng nhập:
  - Tổng quan trạng thái JWT
  - Thông tin cá nhân
  - Danh sách người dùng
  - Xem JWT + Header + Payload/Claims
  - Copy token
  - Test API có Bearer token và test request không có token
  - Logout
- AJAX/jQuery + localStorage theo hướng demo trong bài giảng

## Tài khoản test
- Email: `user@gmail.com`
- Password: `123456`

## Chạy trên IntelliJ
1. File -> Open -> chọn thư mục project.
2. Chờ IntelliJ import Maven dependencies.
3. Project SDK: JDK 17 hoặc mới hơn.
4. Run `JwtNimbusApplication`.
5. Mở `http://localhost:8005/login`.

Mặc định project dùng H2 để chạy ngay. Có `application-mysql.properties` nếu muốn chuyển sang MySQL.
