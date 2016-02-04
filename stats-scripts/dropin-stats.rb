require 'active_record'
require 'mysql2'

ActiveRecord::Base.establish_connection(
  adapter: 'mysql2',
  host: 'dropindb.c1jwuscrdqhb.us-east-1.rds.amazonaws.com',
  database: 'dropin',
  username: 'mtdhue',
  password: '3ACReb8axayA'
)

Client.find_by_sql(
  "SELECT * FROM clients
  INNER JOIN orders ON clients.id = orders.client_id
  ORDER BY clients.created_at desc"
)
