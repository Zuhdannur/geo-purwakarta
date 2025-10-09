#!/bin/bash

echo "🔧 Prisma Migration Fix Tool"
echo "=============================="
echo ""
echo "Choose an option:"
echo "1. Reset database completely (DELETES ALL DATA) - Recommended for development"
echo "2. Mark failed migration as resolved (keeps data, may cause issues)"
echo "3. Manual fix - Connect to database shell"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
  1)
    echo ""
    echo "⚠️  WARNING: This will DELETE ALL DATA in the database!"
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
      echo ""
      echo "🛑 Stopping containers..."
      docker-compose down
      
      echo "🗑️  Removing database volume..."
      docker volume rm map-purwakarta-nextjs_postgres_data 2>/dev/null || echo "Volume already removed or doesn't exist"
      
      echo "🚀 Starting containers with fresh database..."
      docker-compose up -d
      
      echo ""
      echo "✅ Database reset complete!"
      echo "📊 Migrations will run automatically on startup"
      echo ""
      echo "To view logs: docker-compose logs -f app"
    else
      echo "Operation cancelled."
    fi
    ;;
    
  2)
    echo ""
    echo "⚙️  Marking failed migration as resolved..."
    
    # Mark the migration as rolled back/resolved
    docker exec -i map-purwakarta-postgres psql -U postgres -d map_purwakarta << 'EOF'
-- Mark the failed migration as rolled back so Prisma can retry
UPDATE "_prisma_migrations" 
SET finished_at = NOW(), 
    rolled_back_at = NOW() 
WHERE migration_name = '20251007221951_init' 
  AND finished_at IS NULL;

-- Show current migration status
SELECT migration_name, finished_at, rolled_back_at, applied_steps_count 
FROM "_prisma_migrations" 
ORDER BY started_at DESC;
EOF
    
    echo ""
    echo "✅ Migration marked as resolved"
    echo "🔄 Restarting app container to retry migrations..."
    docker-compose restart app
    
    echo ""
    echo "📊 Check logs: docker-compose logs -f app"
    ;;
    
  3)
    echo ""
    echo "🔌 Connecting to PostgreSQL database..."
    echo "📝 You can manually inspect and fix the migration"
    echo ""
    echo "Useful commands:"
    echo "  \\dt                          - List all tables"
    echo "  \\d \"User\"                    - Describe User table"
    echo "  SELECT * FROM \"_prisma_migrations\"; - Show migration status"
    echo "  \\q                          - Quit"
    echo ""
    docker exec -it map-purwakarta-postgres psql -U postgres -d map_purwakarta
    ;;
    
  *)
    echo "Invalid choice. Exiting."
    exit 1
    ;;
esac

