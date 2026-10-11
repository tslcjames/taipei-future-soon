require 'cgi'
require 'json'

source = ARGV.fetch(0)
html = File.read(source)
body = html.match(/網友的提問.*?<\/div><span class="text_exposed_hide">/m)&.to_s
abort 'Could not find Facebook post text' unless body

paragraphs = body.scan(/<p>(.*?)<\/p>/m).flatten.flat_map do |paragraph|
  CGI.unescapeHTML(paragraph.gsub(/<br\s*\/>/, "\n").gsub(/<[^>]+>/, '')).split("\n").map(&:strip)
end.reject(&:empty?)

categories = {
  '交通問題' => '交通',
  'Ubike與自行車問題' => '自行車',
  '無菸城市問題' => '環境',
  '都市規劃與更新問題' => '都市更新',
  '性產業' => '夜間治理',
  '砍樹問題' => '都市森林',
  '選舉問題' => '選舉',
  '市政問題' => '市政',
  '政治問題' => '政治',
  '市長人設問題' => '政治',
  '市民意見管道問題' => '市民參與',
  '觀光問題' => '觀光',
  '校園教育問題' => '教育',
  '棒球迷問題' => '棒球',
  '動漫問題' => '文化',
  '市容問題' => '市容',
  '社會問題' => '社會',
  '環保問題' => '環境',
  '登山問題' => '登山'
}

questions = []
category = nil
paragraphs.each do |line|
  clean = line.sub(/^\.\.\.\s*/, '').strip
  heading = clean.sub(/：\z/, '')
  if categories.key?(heading)
    category = categories.fetch(heading)
    next
  end

  if (match = clean.match(/\A(\d{1,2})\s*(.+)\z/)) && match[1].to_i.between?(1, 48) && match[1].to_i == questions.length + 1
    questions << { id: match[1].to_i, category: category, question: match[2].strip, answer: [] }
  elsif questions.any?
    questions.last[:answer] << clean
  end
end

abort "Expected 48 questions, found #{questions.length}" unless questions.length == 48
abort 'Missing category' if questions.any? { |q| q[:category].nil? }

questions.each do |question|
  question[:status] = question[:answer].empty? ? 'unanswered' : 'summary'
end

data = {
  title: '網友的提問，與沈伯洋的回答',
  attribution: '黃暐瀚於 Facebook 發布的整理貼文',
  source: 'https://www.facebook.com/share/p/19x1PjGU3N/',
  intro: [
    '整理完臉書與 Threads 的網友提問之後，作者將市民關心的問題分類，並附上沈伯洋先前回答過的內容供參考。',
    '這是原貼文內容的互動式整理，文中說法與承諾均歸屬於原貼文，並非本站獨立查證或候選人官方發布。'
  ],
  questions: questions
}

File.write(ARGV.fetch(1), JSON.pretty_generate(data, ascii_only: false) + "\n")
