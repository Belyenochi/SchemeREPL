function tokenize(txt) {
  var tokens = new Array(), oldTxt=null;
  var in_srfi_30_comment = 0;

  while( txt != "" && oldTxt != txt ) {
    oldTxt = txt;
    txt = txt.replace( /^\s*(;[^\r\n]*(\r|\n|$)|#;|#\||#\\[^\w]|#?(\(|\[|{)|\)|\]|}|\'|`|,@|,|\+inf\.0|-inf\.0|\+nan\.0|\"(\\(.|$)|[^\"\\])*(\"|$)|[^\s()\[\]{}]+)/,
    function($0,$1) {
      var t = $1;

      if (t == "#|") {
        in_srfi_30_comment++;
        return "";
      }
      else if (in_srfi_30_comment > 0) {
        if ( /(.*\|#)/.test(t) ) {
          in_srfi_30_comment--;
          if (in_srfi_30_comment < 0) {
            throw new BiwaScheme.Error("Found an extra comment terminator: `|#'")
          }
          console.log(RegExp.$1);
          // Push back the rest substring to input stream.
          return t.substring(RegExp.$1.length, t.length);
        }
        else {
          return "";
        }
      }
      else {
        if( t.charAt(0) != ';' ) tokens[tokens.length]=t;
        return "";
      }
    } );
  }
  return tokens;
}
console.log(tokenize("(define test 2)"));
console.log(tokenize("(define= test \nlambda (a b)\n(display a))"));