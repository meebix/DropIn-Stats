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

class Event < ActiveRecord::Base
end

class Timeline < ActiveRecord::Base
end

class EventsUsers < ActiveRecord::Base
end

def bar_pointer(bar_id)
  bar_query = Parse::Query.new("Bar")
  bar_query.eq("objectId", "#{bar_id}")
  bar = bar_query.get.first
end

def event_pointer(event_id)
  event_query = Parse::Query.new("Events")
  event_query.eq("objectId", "#{event_id}")
  event = event_query.get.first
end

def save_stats(bar_id, credits_earned)
  event_stats = Parse::Object.new("Stats_Events")
  event = event_pointer(event_id)
  bar = bar_pointer(bar_id)

  event_stats["calcDate"] = Parse::Date.new(DateTime.now)
  event_stats["eventId"] = event
  event_stats["barId"] = bar
  event_stats["usersSentTo"] = users_sent_to
  event_stats["creditsEarned"] = credits_earned

  event_stats.save

  puts "Event stats record successfully created for bar #{bar_id}"
end

def calc_stats(bar_id)
  start_calc_datetime = 1.day.ago.change({ hour: 9, min: 0, sec: 0, usec: 0 }).iso8601
  end_calc_datetime = Time.now.change({ hour: 9, min: 0, sec: 0, usec: 0 }).iso8601

  credits_earned = Timeline.find_by_sql("
    SELECT * FROM timelines
    WHERE bar_id = '#{bar_id}' AND
                    event_type = 'Credit Earned' AND
                    date BETWEEN '#{start_calc_datetime}' AND '#{end_calc_datetime}'
  ").count

  save_stats(bar_id, credits_earned)
end

Event.find_each do |event|
  puts "Running event stats for #{event.name}"
  calc_stats(event.object_id)
end
