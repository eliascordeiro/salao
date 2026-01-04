#!/bin/bash

echo "🚀 Conectando ao Railway..."
echo ""
echo "Execute os comandos abaixo no Railway Shell (railway run bash):"
echo ""
echo "---COPIE E EXECUTE NO RAILWAY---"
cat << 'EOF'

# Verificar se usuário existe
npx prisma studio --browser none &
STUDIO_PID=$!

# Ou use o prisma db execute
cat > /tmp/cleanup.sql << 'SQL'
-- Verificar usuário
SELECT id, email, name FROM "User" WHERE email = 'agendahorasalao@gmail.com';

-- Se existir, execute os comandos abaixo:

-- 1. Deletar SubscriptionPayment
DELETE FROM "SubscriptionPayment" 
WHERE "subscriptionId" IN (
  SELECT id FROM "Subscription" WHERE "userId" IN (
    SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
  )
);

-- 2. Deletar Subscription
DELETE FROM "Subscription" 
WHERE "userId" IN (
  SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
);

-- 3. Deletar TicketMessage
DELETE FROM "TicketMessage" 
WHERE "ticketId" IN (
  SELECT id FROM "SupportTicket" WHERE "userId" IN (
    SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
  )
);

-- 4. Deletar SupportTicket
DELETE FROM "SupportTicket" 
WHERE "userId" IN (
  SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
);

-- 5. Deletar Payment de agendamentos
DELETE FROM "Payment" 
WHERE "bookingId" IN (
  SELECT id FROM "Booking" WHERE "salonId" IN (
    SELECT id FROM "Salon" WHERE "ownerId" IN (
      SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
    )
  )
);

-- 6. Deletar Booking dos salões
DELETE FROM "Booking" 
WHERE "salonId" IN (
  SELECT id FROM "Salon" WHERE "ownerId" IN (
    SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
  )
);

-- 7. Deletar Booking do usuário (como cliente)
DELETE FROM "Booking" 
WHERE "userId" IN (
  SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
);

-- 8. Deletar Expense
DELETE FROM "Expense" 
WHERE "salonId" IN (
  SELECT id FROM "Salon" WHERE "ownerId" IN (
    SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
  )
);

-- 9. Deletar ServiceStaff
DELETE FROM "ServiceStaff" 
WHERE "staffId" IN (
  SELECT id FROM "Staff" WHERE "salonId" IN (
    SELECT id FROM "Salon" WHERE "ownerId" IN (
      SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
    )
  )
);

DELETE FROM "ServiceStaff" 
WHERE "serviceId" IN (
  SELECT id FROM "Service" WHERE "salonId" IN (
    SELECT id FROM "Salon" WHERE "ownerId" IN (
      SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
    )
  )
);

-- 10. Deletar Staff
DELETE FROM "Staff" 
WHERE "salonId" IN (
  SELECT id FROM "Salon" WHERE "ownerId" IN (
    SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
  )
);

-- 11. Deletar Service
DELETE FROM "Service" 
WHERE "salonId" IN (
  SELECT id FROM "Salon" WHERE "ownerId" IN (
    SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
  )
);

-- 12. Deletar Availability
DELETE FROM "Availability" 
WHERE "salonId" IN (
  SELECT id FROM "Salon" WHERE "ownerId" IN (
    SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
  )
);

-- 13. Deletar Transaction
DELETE FROM "Transaction" 
WHERE "userId" IN (
  SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
);

-- 14. Deletar Payment do usuário
DELETE FROM "Payment" 
WHERE "userId" IN (
  SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
);

-- 15. Deletar Salon
DELETE FROM "Salon" 
WHERE "ownerId" IN (
  SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
);

-- 16. Desvincular usuários gerenciados
UPDATE "User" SET "ownerId" = NULL 
WHERE "ownerId" IN (
  SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
);

-- 17. Desvincular Staff Profile
UPDATE "Staff" SET "userId" = NULL 
WHERE "userId" IN (
  SELECT id FROM "User" WHERE email = 'agendahorasalao@gmail.com'
);

-- 18. Deletar User
DELETE FROM "User" WHERE email = 'agendahorasalao@gmail.com';

SQL

echo "✅ SQL gerado em /tmp/cleanup.sql"
echo "Execute: psql $DATABASE_URL -f /tmp/cleanup.sql"

EOF

echo "---FIM DOS COMANDOS---"
echo ""
echo "OU simplifique usando este comando Node.js:"
echo "railway run node cleanup-agendahora.js"
