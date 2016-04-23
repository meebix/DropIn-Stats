require 'active_record'
require 'parse-ruby-client'
require 'active_support/core_ext/date_time/calculations'
require 'active_support/core_ext/date/calculations'
require 'active_support/core_ext/time/calculations'
require 'mysql2'
require '../environments'

ActiveRecord::Base.establish_connection(
  adapter: 'mysql2',
  host: DB_HOST,
  database: DB,
  username: DB_USERNAME,
  password: DB_PASSWORD
)

parse = Parse.init application_id: PARSE_ID, api_key: PARSE_REST_API

class User < ActiveRecord::Base
end

class Timeline < ActiveRecord::Base
end

class RewardsUsers < ActiveRecord::Base
end

def user_role_object_id
  user_role_query = Parse::Query.new("Role")
  user_role_query.eq("name", "User")
  user_role = user_role_query.get.first["objectId"]
end

def guest_level_object_id
  guest_level_query = Parse::Query.new("Loyalty_Levels")
  guest_level_query.eq("name", "Guest")
  guest_level = guest_level_query.get.first["objectId"]
end

def regular_level_object_id
  regular_level_query = Parse::Query.new("Loyalty_Levels")
  regular_level_query.eq("name", "Regular")
  regular_level = regular_level_query.get.first["objectId"]
end

def vip_level_object_id
  vip_level_query = Parse::Query.new("Loyalty_Levels")
  vip_level_query.eq("name", "VIP")
  vip_level = vip_level_query.get.first["objectId"]
end

def save_stats(
  total_users,
  total_males,
  total_females,
  total_gender_unknown,
  total_guests,
  total_regulars,
  total_vips,
  age_35plus,
  age_3034,
  age_2529,
  age_2124,
  active_users,
  traffic,
  rewards_redeemed
)
  dropin_stats = Parse::Object.new("Stats_DropIn")

  dropin_stats["calcDate"] = Parse::Date.new(Date.yesterday)
  dropin_stats["totalUsers"] = total_users
  dropin_stats["totalActiveUsersByCredit"] = active_users
  dropin_stats["totalTrafficByCredit"] = traffic
  dropin_stats["totalRewardsRedeemed"] = rewards_redeemed
  dropin_stats["totalMales"] = total_males
  dropin_stats["totalFemales"] = total_females
  dropin_stats["totalGenderUnknown"] = total_gender_unknown
  dropin_stats["totalGuests"] = total_guests
  dropin_stats["totalRegulars"] = total_regulars
  dropin_stats["totalVips"] = total_vips
  dropin_stats["age2124"] = age_2124
  dropin_stats["age2529"] = age_2529
  dropin_stats["age3034"] = age_3034
  dropin_stats["age35Plus"] = age_35plus

  dropin_stats.save

  puts "Drop In stats record successfully created"
end

def calc_stats()
  start_calc_datetime = 1.day.ago.change({ hour: 9, min: 0, sec: 0, usec: 0 }).iso8601
  end_calc_datetime = Time.now.change({ hour: 9, min: 0, sec: 0, usec: 0 }).iso8601

  fourteen_days_ago = 14.days.ago.iso8601

  thirty_five_years_ago = 35.years.ago.iso8601
  thirty_years_ago = 30.years.ago.iso8601
  twenty_five_years_ago = 25.years.ago.iso8601

  user_role_id = user_role_object_id
  guest_level_id = guest_level_object_id
  regular_level_id = regular_level_object_id
  vip_level_id = vip_level_object_id

  total_users = User.find_by_sql("SELECT * FROM users WHERE role_id = '#{user_role_id}'").count
  total_males = User.find_by_sql("SELECT * FROM users WHERE role_id = '#{user_role_id}' AND gender = 'Male'").count
  total_females = User.find_by_sql("SELECT * FROM users WHERE role_id = '#{user_role_id}' AND gender = 'Female'").count
  total_gender_unknown = User.find_by_sql("SELECT * FROM users WHERE role_id = '#{user_role_id}' AND gender IS NULL").count
  total_guests = User.find_by_sql("SELECT * FROM users WHERE role_id = '#{user_role_id}' AND loyaltylevel_id = '#{guest_level_id}'").count
  total_regulars = User.find_by_sql("SELECT * FROM users WHERE role_id = '#{user_role_id}' AND loyaltylevel_id = '#{regular_level_id}'").count
  total_vips = User.find_by_sql("SELECT * FROM users WHERE role_id = '#{user_role_id}' AND loyaltylevel_id = '#{vip_level_id}'").count
  age_35plus = User.find_by_sql("SELECT * FROM users WHERE role_id = '#{user_role_id}' AND dob <= '#{thirty_five_years_ago}'").count
  age_3034 = User.find_by_sql("SELECT * FROM users WHERE role_id = '#{user_role_id}' AND dob BETWEEN '#{thirty_five_years_ago}' AND '#{thirty_years_ago}'").count
  age_2529 = User.find_by_sql("SELECT * FROM users WHERE role_id = '#{user_role_id}' AND dob BETWEEN '#{thirty_years_ago}' AND '#{twenty_five_years_ago}'").count
  age_2124 = User.find_by_sql("SELECT * FROM users WHERE role_id = '#{user_role_id}' AND dob >= '#{twenty_five_years_ago}'").count

  active_users = Timeline.find_by_sql("
    SELECT DISTINCT user_id FROM timelines
    (event_type = 'Credit Earned' OR event_type = 'Reward Redeemed') AND
    date >= '#{fourteen_days_ago}'
  ").count

  traffic = Timeline.find_by_sql("
    SELECT * FROM timelines
    WHERE event_type = 'Credit Earned' AND
    date BETWEEN '#{start_calc_datetime}' AND '#{end_calc_datetime}'
  ").count

  rewards_redeemed = RewardsUsers.find_by_sql("
    SELECT * FROM rewards_users
    WHERE user_has_redeemed = 1 AND
    redeemed_date BETWEEN '#{start_calc_datetime}' AND '#{end_calc_datetime}'
  ").count

  save_stats(
    total_users,
    total_males,
    total_females,
    total_gender_unknown,
    total_guests,
    total_regulars,
    total_vips,
    age_35plus,
    age_3034,
    age_2529,
    age_2124,
    active_users,
    traffic,
    rewards_redeemed
  )
end

puts "Running Drop In stats"
calc_stats()
