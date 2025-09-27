let s = new Sprite(c.center, new Vector(100), "soldier_walk", "#ff0000");

s.origin.x = 25;

function render() {
    ctx.clearRect(0, 0, c.width, c.height);
    s.render();

    ctx.strokeStyle = "#ffffff88";
    ctx.beginPath();
    ctx.strokeRect(s.pos.x, s.pos.y, s.size.x, s.size.y);

    ctx.strokeStyle = "#ff0000";
    ctx.beginPath();
    ctx.moveTo(s.left, s.top);
    ctx.lineTo(s.left, s.bottom);
    ctx.stroke();

    ctx.strokeStyle = "#00ff00";
    ctx.beginPath();
    ctx.moveTo(s.right, s.top);
    ctx.lineTo(s.right, s.bottom);
    ctx.stroke();

    ctx.strokeStyle = "#0088ff";
    ctx.beginPath();
    ctx.moveTo(s.left, s.top);
    ctx.lineTo(s.right, s.top);
    ctx.stroke();

    ctx.strokeStyle = "#ff00ff";
    ctx.beginPath();
    ctx.moveTo(s.left, s.bottom);
    ctx.lineTo(s.right, s.bottom);
    ctx.stroke();

    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.arc(s.pos.x + s.origin.x, s.pos.y + s.origin.y, 5, 0, Math.PI * 2);
    ctx.fill();
}

function update() {
    if (isKeyJustPressed("space")) {
        s.scale.x *= -1;
    }

    if (isKeyPressed("right")) {
        s.origin.x += 1;
    }

    if (isKeyPressed("left")) {
        s.origin.x -= 1;
    }

    if (isKeyPressed("up")) {
        s.origin.y -= 1;
    }

    if (isKeyPressed("down")) {
        s.origin.y += 1;
    }

    if (isKeyPressed("q")) {
        s.rotation -= 1;
    }

    if (isKeyPressed("e")) {
        s.rotation += 1;
    }
}