function assert(condition, message) {
    if (!condition) {
        message = message || "Assertion failed";
        if (typeof Error !== "undefined") {
            throw new Error(message);
        }
        throw message; // Fallback
    }
}
// assert(run("#t") === true)
// assert(run("23") === 23)
// assert(run("+ 23 42") === 65)
// assert(run("+ 14 (* 23 42)") === 980)
// assert(run("(define x 23)(define y 42)(+ x y)") === 65)