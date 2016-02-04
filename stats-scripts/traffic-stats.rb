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

class Bar < ActiveRecord::Base
end

class Timeline < ActiveRecord::Base
end

class TrafficStats < ActiveRecord::Base
end

def bar_pointer(bar_id)
  bar_query = Parse::Query.new("Bar")
  bar_query.eq("objectId", "#{bar_id}")
  bar = bar_query.get.first
end

def save_stats(bar_id, credits_earned)
  traffic_stats = Parse::Object.new("Stats_Test")

  traffic_stats["calcDate"] = Parse::Date.new(DateTime.now)
  traffic_stats["barId"] = bar
  traffic_stats["visitsByCredit"] = credits_earned

  traffic_stats.save

  puts "Traffic stats record successfully created for bar #{bar_id}"
end

def calc_stats(bar_id)
  start_calc_datetime = 1.day.ago.change({ hour: 9, min: 0, sec: 0, usec: 0 }).iso8601
  end_calc_datetime = Time.now.change({ hour: 9, min: 0, sec: 0, usec: 0 }).iso8601

  credits_earned = Timeline.find_by_sql("
    SELECT * FROM timelines
    WHERE bar_id = '#{bar_id}' AND
                    event_type = 'Credit Earned' AND
                    date between '#{start_calc_datetime}' and '#{end_calc_datetime}'
  ").count

  save_stats(bar_id, credits_earned)
end

Bar.find_each do |bar|
  puts "Running traffic stats for #{bar.name}"
  calc_stats(bar.object_id)
end
