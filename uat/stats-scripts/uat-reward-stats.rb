require 'active_record'
require 'parse-ruby-client'
require 'active_support/core_ext/date_time/calculations'
require 'active_support/core_ext/date/calculations'
require 'active_support/core_ext/time/calculations'
require 'mysql2'
require '../../environments'

ActiveRecord::Base.establish_connection(
  adapter: 'mysql2',
  host: ENV["DB_HOST"],
  database: ENV["UAT_DB"],
  username: ENV["DB_USERNAME"],
  password: ENV["DB_PASSWORD"]
)

parse = Parse.init application_id: PARSE_ID, api_key: PARSE_REST_API

class Bar < ActiveRecord::Base
end

class RewardsUsers < ActiveRecord::Base
end

def bar_pointer(bar_id)
  bar_query = Parse::Query.new("Bar")
  bar_query.eq("objectId", "#{bar_id}")
  bar = bar_query.get.first
end

def save_stats(
  bar_id,
  rewards_redeemed
)
  reward_stats = Parse::Object.new("Stats_Rewards")
  bar = bar_pointer(bar_id)

  reward_stats["calcDate"] = Parse::Date.new(Date.yesterday)
  reward_stats["barId"] = bar
  reward_stats["rewardsRedeemed"] = rewards_redeemed

  reward_stats.save

  puts "Reward stats record successfully created for bar #{bar_id}"
end

def calc_stats(bar_id)
  start_calc_datetime = 1.day.ago.change({ hour: 9, min: 0, sec: 0, usec: 0 }).iso8601
  end_calc_datetime = Time.now.change({ hour: 9, min: 0, sec: 0, usec: 0 }).iso8601

  rewards_redeemed = RewardsUsers.find_by_sql("
    SELECT * FROM rewards_users
    WHERE bar_id = '#{bar_id}' AND
    user_has_redeemed = 1 AND
    redeemed_date BETWEEN '#{start_calc_datetime}' AND '#{end_calc_datetime}'
  ").count

  save_stats(
    bar_id,
    rewards_redeemed
  )
end

Bar.find_each do |bar|
  puts "Running reward stats for #{bar.name}"
  calc_stats(bar.object_id)
end
