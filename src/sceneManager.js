/**
 * Dependencies: camera
 */

class SceneManager {
}

class Scene {
    id = "";

    disabled = false;

    objects = {
        cameras: [],
        static: [],
        dynamic: [],
    }

    constructor(id) {

    }

    update() {
        this.objects.static.forEach(o => {
            if ("update" in o) o.update();
        });

        this.objects.dynamic.forEach(o => {
            if ("update" in o) o.update();
        });

        this.objects.cameras.forEach(c => {
            c.update();
        });
    }

    render() {
        this.objects.static.forEach(o => {
            if ("render" in o) o.render();
        });

        this.objects.dynamic.forEach(o => {
            if ("render" in o) o.render();
        });
    }
}