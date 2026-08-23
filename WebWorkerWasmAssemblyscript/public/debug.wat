(module
 (type $0 (func (param i32)))
 (type $1 (func (param i32 i32) (result i32)))
 (type $2 (func (param i32 i32 i32 i32)))
 (type $3 (func))
 (import "env" "console.log" (func $~lib/bindings/dom/console.log (param i32)))
 (import "env" "abort" (func $~lib/builtins/abort (param i32 i32 i32 i32)))
 (global $~lib/memory/__data_end i32 (i32.const 44))
 (global $~lib/memory/__stack_pointer (mut i32) (i32.const 32812))
 (global $~lib/memory/__heap_base i32 (i32.const 32812))
 (memory $0 1)
 (data $0 (i32.const 12) "\1c\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00\0c\00\00\00A\00d\00d\00i\00n\00g\00")
 (table $0 1 1 funcref)
 (elem $0 (i32.const 1))
 (export "add" (func $assembly/calengine/add))
 (export "memory" (memory $0))
 (func $assembly/calengine/add (param $a i32) (param $b i32) (result i32)
  i32.const 32
  call $~lib/console/console.log
  local.get $a
  local.get $b
  i32.add
  return
 )
 (func $~stack_check
  global.get $~lib/memory/__stack_pointer
  global.get $~lib/memory/__data_end
  i32.lt_s
  if
   i32.const 32832
   i32.const 32880
   i32.const 1
   i32.const 1
   call $~lib/builtins/abort
   unreachable
  end
 )
 (func $~lib/console/console.log (param $message i32)
  (local $1 i32)
  global.get $~lib/memory/__stack_pointer
  i32.const 4
  i32.sub
  global.set $~lib/memory/__stack_pointer
  call $~stack_check
  global.get $~lib/memory/__stack_pointer
  i32.const 0
  i32.store
  local.get $message
  local.set $1
  global.get $~lib/memory/__stack_pointer
  local.get $1
  i32.store
  local.get $1
  call $~lib/bindings/dom/console.log
  global.get $~lib/memory/__stack_pointer
  i32.const 4
  i32.add
  global.set $~lib/memory/__stack_pointer
 )
)
