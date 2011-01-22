var argv = process.argv.slice(2)
  , user = argv[0] || process.getuid()
  , group = argv[1] || process.getgid()

if (!isNaN(user)) user = +user
if (!isNaN(group)) group = +group


console.error([user, group])


process.setgid(group)
process.setuid(user)

console.log(JSON.stringify({uid:+process.getuid(), gid:+process.getgid()}))
