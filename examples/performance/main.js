
/* Tester fuctions */

function loopingThroughAnArray() {
    const size = 10_000;
    let arr = Array(size).fill(0);

    bench1(arr);
    bench2(arr);
    bench3(arr); /* fastest */
}

function arrayOrDictionary() {
    let arr = Array(10_000).fill(0);
    let obj = {};

    for (let i = 0; i < 10_000; i++) {
        obj["_"+i] = 0;
    }

    bench4(arr);
    bench5(obj); /* fastest */
}

function array1dOr2d() {
    const size = 100;

    let arr1d = Array(size*size).fill(0);
    let arr2d = Array(size).fill(Array(size).fill(0));

    bench6(arr2d);
    bench7(arr1d); /* fastest */
}

function mapOrFor() {
    const size = 100_000;

    let arr1 = Array(size).fill(null);
    let arr2 = Array(size).fill(null);

    arr1 = bench8(arr1); /* fasterst */
    arr2 = bench9(arr2);

    console.log(arr1, arr2);
}

class TestCell {
    value = "";
    id = 0;

    constructor(id, value) {
        this.id = id;
        this.value = value;
    }
}

function objectOrClass() {
    const size = 100_000;
    let objectArray = Array(size).fill(null);
    objectArray = objectArray.map(function (v, i) {
        return {id: i, value: "_" + i}
    });

    let classArray = Array(size).fill(null);
    classArray = classArray.map(function (v, i) {
        return new TestCell(i, "_" + i)
    });

    // Reading
    bench10(objectArray);
    bench11(classArray); /* fastest */

    // Updating
    bench12(objectArray); /* fastest */
    bench13(classArray);

    console.log(objectArray, classArray);
}


function arrayCreation() {
    const size = 100_000;

    let arr1 = bench14(size); /* fastest */
    let arr2 = bench15(size);

    console.log(arr1);
    console.log(arr2);
}

/* Benchmkarks */

function bench1(array) {
    console.log("Staring 1");

    for (let i = 0; i < array.length; i++) {
        console.log(array[i]);
    }

    console.log("End 1");
}

function bench2(array) {
    console.log("Staring 2");
    
    array.forEach(function (v, i) {
        console.log(v);
    });
    
    console.log("End 2");
}

function bench3(array) {
    console.log("Staring 3");

    for (let v of array) {
        console.log(v);
    }

    console.log("End 3");
}

function bench4(array) {
    console.log("Staring 4");
    
    for (let i in array) {
        console.log(array[i]);
    }

    console.log("End 4");
}

function bench5(object) {
    console.log("Staring 5");
    
    for (let i in object) {
        console.log(object[i]);
    }

    console.log("End 5");
}

function bench6(array2d) {
    console.log("Staring 6");
    
    for (let line of array2d) {
        for (let value of line) {
            console.log(value);
        }
    }

    console.log("End 6");
}

function bench7(array) {
    console.log("Staring 7");
    
    for (let value of array) {
        console.log(value);
    }

    console.log("End 7");
}

function bench8(array) {
    console.log("Staring 8");
    
    let out = [];

    for (let i in array) {
        out[i] = i;
    }

    console.log("End 8");

    return out;
}

function bench9(array) {
    console.log("Staring 9");
    
    let out = array.map(function(value, index) {
        return index;
    });

    console.log("End 9");

    return out;
}

function bench10(array) {
    console.log("Staring 10");
    
    for (let i in array) {
        console.log(array[i]);
    }

    console.log("End 10");
}

function bench11(array) {
    console.log("Staring 11");
    
    for (let i in array) {
        console.log(array[i]);
    }

    console.log("End 11");
}

function bench12(array) {
    console.log("Staring 12");
    
    let out = [];

    for (let i in array) {
        array[i].value = "AA" + i;
    }

    console.log("End 12");
}

function bench13(array) {
    console.log("Staring 13");
    
    let out = [];

    for (let i in array) {
        array[i].value = "AA" + i;
    }

    console.log("End 13");
}

function bench14(size) {
    console.log("Staring 14");
    
    let out = Array(size).fill(null);

    console.log("End 14");

    return out;
}

function bench15(size) {
    console.log("Staring 15");
    
    let out = [];

    for (let i = 0; i < size; i++) out.push(null);

    console.log("End 15");

    return out;
}


/* MAIN */
loopingThroughAnArray(); // for of OR for in
arrayOrDictionary() // Array
array1dOr2d() // 1d
mapOrFor() // For
objectOrClass() // Reading: class, updating in place: class
arrayCreation() // Array(<size>).fill(<value>)

// todo: static method or prototype.a() if faster to call, because static methods are might still be instantiated