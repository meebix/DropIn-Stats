require 'active_record'
require 'parse-ruby-client'
require 'active_support/core_ext/date_time/calculations'
require 'active_support/core_ext/date/calculations'
require 'active_support/core_ext/time/calculations'
require 'mysql2'

ActiveRecord::Base.establish_connection(
  adapter: 'mysql2',
  host: ENV["DB_HOST"],
  database: 'dropin',
  username: ENV["DB_USERNAME"],
  password: ENV["DB_PASSWORD"]
)

parse = Parse.init :application_id => ENV["PARSE_ID"],
                              :api_key          => ENV["PARSE_REST_API"]

class User < ActiveRecord::Base
end

class Timeline < ActiveRecord::Base
end

class RewardsUsers < ActiveRecord::Base
end

def save_stats()
  dropin_stats = Parse::Object.new("Stats_DropIn")

  dropin_stats["calcDate"] = Parse::Date.new(DateTime.now)
  dropin_stats["totalUsers"]
  dropin_stats["totalActiveUsersByCredit"]
  dropin_stats["totalTrafficByCredit"]
  dropin_stats["totalRewardsRedeemed"]
  dropin_stats["totalMales"]
  dropin_stats["totalFemales"]
  dropin_stats["totalGuests"]
  dropin_stats["totalRegulars"]
  dropin_stats["totalVips"]
  dropin_stats["age2124"]
  dropin_stats["age2529"]
  dropin_stats["age3034"]
  dropin_stats["age35Plus"]

  dropin_stats.save

  puts "Drop In stats record successfully created"
end

def calc_stats()
  start_calc_datetime = 1.day.ago.change({ hour: 9, min: 0, sec: 0, usec: 0 }).iso8601
  end_calc_datetime = Time.now.change({ hour: 9, min: 0, sec: 0, usec: 0 }).iso8601

  thirty_days_ago = 2.days.ago.iso8601

  thirty_five_years_ago = 35.years.ago.iso8601
  thirty_years_ago = 30.years.ago.iso8601
  twenty_five_years_ago = 25.years.ago.iso8601
  twenty_one_years_ago = 21.years.ago.iso8601

  total_users = User.find_by_sql("SELECT * FROM users WHERE role_id = 'ArWsSwq2Ky'").count
  total_males = User.find_by_sql("SELECT * FROM users WHERE role_id = 'ArWsSwq2Ky' AND gender = 'Male'").count
  total_females = User.find_by_sql("SELECT * FROM users WHERE role_id = 'ArWsSwq2Ky' AND gender = 'Female'").count
  total_guests = User.find_by_sql("SELECT * FROM users WHERE role_id = 'ArWsSwq2Ky' AND loyaltylevel_id = 'M8u8gbUbCz").count
  total_regulars = User.find_by_sql("SELECT * FROM users WHERE role_id = 'ArWsSwq2Ky' AND loyaltylevel_id = 'rYEH9JLSlP").count
  total_vips = User.find_by_sql("SELECT * FROM users WHERE role_id = 'ArWsSwq2Ky' AND loyaltylevel_id = 'loQTz5MqpZ").count
  age_35plus = User.find_by_sql("SELECT * FROM users WHERE role_id = 'ArWsSwq2Ky' AND dob >= '#{thirty_five_years_ago}'").count
  age_3034 = User.find_by_sql("SELECT * FROM users WHERE role_id = 'ArWsSwq2Ky' AND dob >= '#{thirty_years_ago}'").count
  age_2529 = User.find_by_sql("SELECT * FROM users WHERE role_id = 'ArWsSwq2Ky' AND dob >= '#{twenty_five_years_ago}'").count
  age_2124 = User.find_by_sql("SELECT * FROM users WHERE role_id = 'ArWsSwq2Ky' AND dob >= '#{twenty_one_years_ago}'").count

  active_users = Timeline.find_by_sql("
    SELECT * FROM timelines
    WHERE event_type = 'Credit Earned' AND
    date BETWEEN '#{start_calc_datetime}' AND '#{end_calc_datetime}'
  ").count

  traffic = Timeline.find_by_sql("
    SELECT DISTINCT user_id FROM timelines
    WHERE event_type = 'Credit Earned' AND
    date >= '#{thirty_days_ago}'
  ").count

  rewards_redeemed = RewardsUsers.find_by_sql("
    SELECT * FROM rewards_users
    WHERE user_has_redeemed = 1 AND
    redeemed_date BETWEEN '#{start_calc_datetime}' AND '#{end_calc_datetime}'
  ").count

  save_stats()
end

puts "Running Drop In stats"
calc_stats()
