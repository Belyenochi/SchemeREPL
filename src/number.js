//
// number.js
//

//
// Complex
//
CuteScheme.Complex = CuteScheme.Class.create({
  initialize: function(real, imag){
    this.real = real;
    this.imag = imag;
  },
  magnitude: function(){
    return Math.sqrt(this.real * this.real + this.imag * this.imag);
  },
  angle: function(){
    return Math.atan2(this.imag, this.real);
  },
  isReal: function(){
    return this.imag == 0;
  },
  isRational: function() {
    return this.imag == 0 && CuteScheme.isRational(this.real);
  },
  isInteger: function(){
    return this.imag == 0 && CuteScheme.isInteger(this.real);
  },
  toString: function(radix){
    if (this.real === 0 && this.imag === 0)
      return "0";
    var img = "";
    if (this.imag !== 0) {
      if (this.imag > 0 && this.real !== 0){
          img+="+";
      }
      switch(this.imag) {
          case 1:
              break;
          case -1: img+="-";
               break;
          default: img+=this.imag.toString(radix);
      }
     img+="i";
    }
    var real = "";
    if (this.real !== 0){
      real += this.real.toString(radix);
    }
    return real+img;
  }
})
CuteScheme.Complex.from_polar = function(r, theta){
  var real = r * Math.cos(theta);
  var imag = r * Math.sin(theta);
  return new CuteScheme.Complex(real, imag);
}
CuteScheme.Complex.assure = function(num){
  if(num instanceof CuteScheme.Complex)
    return num
  else
    return new CuteScheme.Complex(num, 0);
}

//
// Rational (unfinished)
//
CuteScheme.Rational = CuteScheme.Class.create({
  initialize: function(numerator, denominator){
    this.numerator = numerator;
    this.denominator = denominator;
  },

  isInteger: function() {
    // FIXME
  }
})

//
// Predicates
//
CuteScheme.isNumber = function(x) {
  return (x instanceof CuteScheme.Complex)  ||
         (x instanceof CuteScheme.Rational) ||
         (typeof(x) == 'number');
};
CuteScheme.isComplex = CuteScheme.isNumber;
CuteScheme.isReal = function(x) {
  if (x instanceof CuteScheme.Complex || x instanceof CuteScheme.Rational) {
    return x.isReal()
  }
  else {
    return (typeof(x) == 'number');
  }
};
CuteScheme.isRational = function(x) {
  if (x instanceof CuteScheme.Complex) {
    return x.isRational();
  }
  else if (x instanceof CuteScheme.Rational) {
    return true;
  }
  else {
    return (typeof(x) == 'number');
  }
};
CuteScheme.isInteger = function(x) {
  if (x instanceof CuteScheme.Complex || x instanceof CuteScheme.Rational) {
    return x.isInteger();
  }
  else {
    return (typeof(x) == 'number') && (x % 1 == 0);
  }
};