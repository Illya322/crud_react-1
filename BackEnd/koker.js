const bcrypt = require('bcryptjs');

bcrypt.hash('password123', 10).then(console.log).catch(console.error);
/*
INSERT INTO users (nombre, email, password)
VALUES ('Administrador', 'admin@example.com', '$2b$10$KmN3Y1fZRQGX5g9wEW9NjuvH7EYbfGA4g9yXr9okNjE5gSeNjtftG');
*/

"$2b$10$KmN3Y1fZRQGX5g9wEW9NjuvH7EYbfGA4g9yXr9okNjE5gSeNjtftG"