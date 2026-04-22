require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name = 'NeurosparkVoice'
  s.version = package['version']
  s.summary = package['description']
  s.license = { :type => 'MIT' }
  s.homepage = 'https://neurospark.app'
  s.author = package['author'] || 'NeuroSpark'
  s.source = { :git => 'https://github.com/local/neurospark-voice', :tag => s.version.to_s }
  s.source_files = 'ios/Sources/**/*.{swift,h,m,c,cc,mm,cpp}'
  s.ios.deployment_target = '14.0'
  s.dependency 'Capacitor'
  s.frameworks = 'Speech', 'AVFoundation'
  s.swift_version = '5.1'
end
