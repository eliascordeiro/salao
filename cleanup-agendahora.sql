-- Script para deletar todos os registros relacionados a agendahorasalao@gmail.com
-- Execute no Railway usando: railway run psql -f cleanup-agendahora.sql

-- 1. Verificar se usuário existe
SELECT 'Verificando usuário...' AS status;
SELECT id, email, name, role FROM "User" WHERE email = 'agendahorasalao@gmail.com';

-- 2. Deletar SubscriptionPayment
DELETE FROM "SubscriptionPayment" 
WHERE "subscriptionId" IN (
  SELECT id FROM "Subscription" WHERE "userId" IN (
    SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
  )
);
SELECT 'SubscriptionPayment deletado' AS status;

-- 3. Deletar Subscription
DELETE FROM "Subscription" 
WHERE "userId" IN (
  SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
);
SELECT 'Subscription deletado' AS status;

-- 4. Deletar TicketMessage
DELETE FROM "TicketMessage" 
WHERE "ticketId" IN (
  SELECT id FROM "SupportTicket" WHERE "userId" IN (
    SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
  )
);
SELECT 'TicketMessage deletado' AS status;

-- 5. Deletar SupportTicket
DELETE FROM "SupportTicket" 
WHERE "userId" IN (
  SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
);
SELECT 'SupportTicket deletado' AS status;

-- 6. Deletar Payment de agendamentos
DELETE FROM "Payment" 
WHERE "bookingId" IN (
  SELECT id FROM "Booking" WHERE "salonId" IN (
    SELECT id FROM "Salon" WHERE "ownerId" IN (
      SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
    )
  )
);
SELECT 'Payment (agendamentos) deletado' AS status;

-- 7. Deletar Booking dos salões
DELETE FROM "Booking" 
WHERE "salonId" IN (
  SELECT id FROM "Salon" WHERE "ownerId" IN (
    SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
  )
);
SELECT 'Booking (salões) deletado' AS status;

-- 8. Deletar Booking do usuário (como cliente)
DELETE FROM "Booking" 
WHERE "userId" IN (
  SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
);
SELECT 'Booking (cliente) deletado' AS status;

-- 9. Deletar Expense
DELETE FROM "Expense" 
WHERE "salonId" IN (
  SELECT id FROM "Salon" WHERE "ownerId" IN (
    SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
  )
);
SELECT 'Expense deletado' AS status;

-- 10. Deletar ServiceStaff (staff)
DELETE FROM "ServiceStaff" 
WHERE "staffId" IN (
  SELECT id FROM "Staff" WHERE "salonId" IN (
    SELECT id FROM "Salon" WHERE "ownerId" IN (
      SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
    )
  )
);
SELECT 'ServiceStaff (staff) deletado' AS status;

-- 11. Deletar ServiceStaff (service)
DELETE FROM "ServiceStaff" 
WHERE "serviceId" IN (
  SELECT id FROM "Service" WHERE "salonId" IN (
    SELECT id FROM "Salon" WHERE "ownerId" IN (
      SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
    )
  )
);
SELECT 'ServiceStaff (service) deletado' AS status;

-- 12. Deletar Staff
DELETE FROM "Staff" 
WHERE "salonId" IN (
  SELECT id FROM "Salon" WHERE "ownerId" IN (
    SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
  )
);
SELECT 'Staff deletado' AS status;

-- 13. Deletar Service
DELETE FROM "Service" 
WHERE "salonId" IN (
  SELECT id FROM "Salon" WHERE "ownerId" IN (
    SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
  )
);
SELECT 'Service deletado' AS status;

-- 14. Deletar Availability
DELETE FROM "Availability" 
WHERE "salonId" IN (
  SELECT id FROM "Salon" WHERE "ownerId" IN (
    SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
  )
);
SELECT 'Availability deletado' AS status;

-- 15. Deletar Transaction
DELETE FROM "Transaction" 
WHERE "userId" IN (
  SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
);
SELECT 'Transaction deletado' AS status;

-- 16. Deletar Payment do usuário
DELETE FROM "Payment" 
WHERE "userId" IN (
  SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
);
SELECT 'Payment (usuário) deletado' AS status;

-- 17. Deletar Salon
DELETE FROM "Salon" 
WHERE "ownerId" IN (
  SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
);
SELECT 'Salon deletado' AS status;

-- 18. Desvincular usuários gerenciados
UPDATE "User" SET "ownerId" = NULL 
WHERE "ownerId" IN (
  SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
);
SELECT 'Usuários gerenciados desvinculados' AS status;

-- 19. Desvincular Staff Profile
UPDATE "Staff" SET "userId" = NULL 
WHERE "userId" IN (
  SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
);
SELECT 'Staff Profile desvinculado' AS status;

-- 20. Deletar User
DELETE FROM "User" WHERE email = 'agendahorasalao@gmail.com';
SELECT 'User deletado' AS status;

-- Verificar se foi deletado
SELECT COUNT(*) as restantes FROM "User" WHERE email = 'agendahorasalao@gmail.com';
SELECT '✅ Limpeza concluída!' AS status;
