Pod::Spec.new do |s|
  s.name           = 'TrailKeys'
  s.version        = '1.0.0'
  s.license        = { :type => 'GPL-3.0-only', :file => '../LICENSE' }
  s.summary        = 'Device signing and passcode derivation for Location Log'
  s.description    = 'Local P-256 signing keys and PBKDF2-SHA256 passcode derivation.'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '16.4',
    :tvos => '16.4'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
