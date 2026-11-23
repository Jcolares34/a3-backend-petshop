-- Quantidade de registros por tabela
SELECT 'usuarios' AS tabela, count(*) AS total FROM usuarios
UNION ALL SELECT 'tutores', count(*) FROM tutores
UNION ALL SELECT 'pets', count(*) FROM pets
UNION ALL SELECT 'consultas', count(*) FROM consultas;

-- Tutores, pets e consultas de cada usuário
SELECT u.email,
       count(DISTINCT t.id) AS tutores,
       count(DISTINCT p.id) AS pets,
       count(c.id) AS consultas
FROM usuarios u
LEFT JOIN tutores t ON t.usuario_id = u.id
LEFT JOIN pets p ON p.tutor_id = t.id
LEFT JOIN consultas c ON c.pet_id = p.id
GROUP BY u.email
ORDER BY u.email;

-- Consultas com o nome do pet e do tutor (data_hora é gravada em UTC; aqui no horário de Brasília)
SELECT c.data_hora AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo' AS data_hora_brasilia, c.motivo, c.status, c.valor, p.nome AS pet, t.nome AS tutor
FROM consultas c
JOIN pets p ON p.id = c.pet_id
JOIN tutores t ON t.id = p.tutor_id
ORDER BY c.data_hora;

-- Consultas por status
SELECT status, count(*) AS total, sum(valor) AS valor_total
FROM consultas
GROUP BY status
ORDER BY status;

-- Pets por espécie
SELECT especie, count(*) AS total
FROM pets
GROUP BY especie
ORDER BY total DESC;

-- Regras CHECK criadas na migration
SELECT conrelid::regclass AS tabela, conname AS regra, pg_get_constraintdef(oid) AS definicao
FROM pg_constraint
WHERE contype = 'c' AND connamespace = 'public'::regnamespace
ORDER BY 1, 2;
