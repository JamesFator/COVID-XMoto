(function() {
  var Assets, Blocks, Camera, Constants, Edges, Entities, Infos, Input, LayerOffsets, Level, Limits, Listeners, Math2D, Moto, MotoFlipService, Physics, Rider, Sky, Theme, b2AABB, b2Body, b2BodyDef, b2CircleShape, b2FixtureDef, b2PolygonShape, b2PrismaticJointDef, b2RevoluteJointDef, b2Settings, b2Vec2, b2World;

  Camera = (function() {
    function Camera(level) {
      this.level = level;
      this.options = level.options;
      this.scale = {
        x: Constants.default_scale.x,
        y: Constants.default_scale.y
      };
      this.translate = {
        x: 0,
        y: 0
      };
      this.scale_container = new PIXI.Container();
      this.translate_container = new PIXI.Container();
      this.negative_z_container = new PIXI.Container();
      this.neutral_z_container = new PIXI.Container();
      this.positive_z_container = new PIXI.Container();
      this.level.stage.addChild(this.scale_container);
      this.scale_container.addChild(this.translate_container);
      this.translate_container.addChild(this.negative_z_container);
      this.translate_container.addChild(this.neutral_z_container);
      this.translate_container.addChild(this.positive_z_container);
    }

    Camera.prototype.init = function() {
      if (Constants.manual_scale) {
        this.init_scroll();
      }
      return this.compute_aabb();
    };

    Camera.prototype.active_object = function() {
      return this.level.moto.body;
    };

    Camera.prototype.move = function() {
      var speed, velocity;
      if (Constants.automatic_scale) {
        velocity = this.active_object().GetLinearVelocity();
        speed = Math2D.distance_between_points(new b2Vec2(0, 0), velocity);
        this.scale.x = this.scale.x * 0.995 + (Constants.default_scale.x / (1.0 + speed / 7.5)) * 0.005;
        this.scale.y = this.scale.y * 0.995 + (Constants.default_scale.y / (1.0 + speed / 7.5)) * 0.005;
        this.translate.x = this.translate.x * 0.97 + velocity.x / 3.0 * 0.03;
        this.translate.y = this.translate.y * 0.99 + velocity.y / 3.0 * 0.01;
        return this.compute_aabb();
      }
    };

    Camera.prototype.update = function() {
      this.scale_container.x = this.options.width / 2;
      this.scale_container.y = this.options.height / 2;
      this.scale_container.scale.x = this.scale.x;
      this.scale_container.scale.y = -this.scale.y;
      this.translate_container.x = -this.target().x;
      this.translate_container.y = this.target().y;
    };

    Camera.prototype.target = function() {
      var adjusted_position, options, position;
      options = this.level.options;
      position = this.active_object().GetPosition();
      return adjusted_position = {
        x: position.x + this.translate.x,
        y: position.y + this.translate.y + 0.25
      };
    };

    Camera.prototype.init_scroll = function() {
      var canvas, scroll;
      scroll = (function(_this) {
        return function(event) {
          var delta, max_limit_x, max_limit_y, min_limit_x, min_limit_y;
          if (event.wheelDelta) {
            delta = event.wheelDelta / 40;
          } else if (event.detail) {
            delta = -event.detail;
          } else {
            delta = 0;
          }
          _this.scale.x += (_this.scale.x / 200) * delta;
          _this.scale.y += (_this.scale.y / 200) * delta;
          min_limit_x = Constants.default_scale.x / 2;
          min_limit_y = Constants.default_scale.y / 2;
          max_limit_x = Constants.default_scale.x * 2;
          max_limit_y = Constants.default_scale.y * 2;
          if (_this.scale.x < min_limit_x) {
            _this.scale.x = min_limit_x;
          }
          if (_this.scale.y > min_limit_y) {
            _this.scale.y = min_limit_y;
          }
          if (_this.scale.x > max_limit_x) {
            _this.scale.x = max_limit_x;
          }
          if (_this.scale.y < max_limit_y) {
            _this.scale.y = max_limit_y;
          }
          return event.preventDefault() && false;
        };
      })(this);
      canvas = $(this.level.options.canvas).get(0);
      canvas.addEventListener('DOMMouseScroll', scroll, false);
      return canvas.addEventListener('mousewheel', scroll, false);
    };

    Camera.prototype.compute_aabb = function() {
      return this.aabb = this.aabb_for_canvas();
    };

    Camera.prototype.aabb_for_clipping = function() {
      var aabb, size_x, size_y;
      size_x = this.options.width * 0.6 / this.scale.x;
      size_y = -this.options.height * 0.6 / this.scale.y;
      aabb = new b2AABB();
      aabb.lowerBound.Set(this.target().x - size_x / 2, this.target().y - size_y / 2);
      aabb.upperBound.Set(this.target().x + size_x / 2, this.target().y + size_y / 2);
      return aabb;
    };

    Camera.prototype.aabb_for_canvas = function() {
      var aabb, size_x, size_y;
      size_x = this.options.width * 1.0 / this.scale.x;
      size_y = -this.options.height * 1.0 / this.scale.y;
      aabb = new b2AABB();
      aabb.lowerBound.Set(this.target().x - size_x / 2, this.target().y - size_y / 2);
      aabb.upperBound.Set(this.target().x + size_x / 2, this.target().y + size_y / 2);
      return aabb;
    };

    return Camera;

  })();

  b2Vec2 = Box2D.Common.Math.b2Vec2;

  Constants = (function() {
    function Constants() {}

    Constants.hooking = true;

    Constants.gravity = 9.81;

    Constants.max_moto_speed = 70.00;

    Constants.air_density = 0.02;

    Constants.moto_acceleration = 9.00;

    Constants.biker_force = 11.00;

    Constants.fps = 60.0;

    Constants.automatic_scale = true;

    Constants.manual_scale = true;

    Constants.default_scale = {
      x: 70.0,
      y: -70.0
    };

    Constants.body = {
      density: 1.5,
      restitution: 0.5,
      friction: 1.0,
      position: {
        x: 0.0,
        y: 1.0
      },
      shape: [new b2Vec2(0.4, -0.3), new b2Vec2(0.50, 0.40), new b2Vec2(-0.75, 0.16), new b2Vec2(-0.35, -0.3)],
      collisions: true,
      texture: 'playerbikerbody',
      texture_size: {
        x: 2.0,
        y: 1.0
      }
    };

    Constants.left_wheel = {
      radius: 0.35,
      density: 1.8,
      restitution: 0.3,
      friction: 1.4,
      position: {
        x: -0.70,
        y: 0.48
      },
      collisions: true,
      texture: 'playerbikerwheel'
    };

    Constants.right_wheel = {
      radius: 0.35,
      density: 1.8,
      restitution: 0.3,
      friction: 1.4,
      position: {
        x: 0.70,
        y: 0.48
      },
      collisions: true,
      texture: 'playerbikerwheel'
    };

    Constants.left_axle = {
      density: 1.0,
      restitution: 0.5,
      friction: 1.0,
      position: {
        x: 0.0,
        y: 1.0
      },
      shape: [new b2Vec2(-0.10, -0.30), new b2Vec2(-0.25, -0.30), new b2Vec2(-0.80, -0.58), new b2Vec2(-0.65, -0.58)],
      collisions: true,
      texture: 'rear1'
    };

    Constants.right_axle = {
      density: 1.5,
      restitution: 0.5,
      friction: 1.0,
      position: {
        x: 0.0,
        y: 1.0
      },
      shape: [new b2Vec2(0.58, -0.02), new b2Vec2(0.48, -0.02), new b2Vec2(0.66, -0.58), new b2Vec2(0.76, -0.58)],
      collisions: true,
      texture: 'front1'
    };

    Constants.head = {
      density: 0.4,
      restitution: 0.0,
      friction: 1.0,
      position: {
        x: -0.27,
        y: 2.26
      },
      radius: 0.18,
      collisions: true
    };

    Constants.torso = {
      density: 0.4,
      restitution: 0.0,
      friction: 1.0,
      position: {
        x: -0.31,
        y: 1.89
      },
      angle: -Math.PI / 30.0,
      shape: [new b2Vec2(0.10, -0.55), new b2Vec2(0.13, 0.15), new b2Vec2(-0.20, 0.22), new b2Vec2(-0.18, -0.55)],
      collisions: true,
      texture: 'playertorso',
      texture_size: {
        x: 0.50,
        y: 1.20
      }
    };

    Constants.lower_leg = {
      density: 0.4,
      restitution: 0.0,
      friction: 1.0,
      position: {
        x: 0.07,
        y: 0.90
      },
      angle: -Math.PI / 6.0,
      shape: [new b2Vec2(0.2, -0.33), new b2Vec2(0.2, -0.27), new b2Vec2(0.00, -0.2), new b2Vec2(0.02, 0.33), new b2Vec2(-0.17, 0.33), new b2Vec2(-0.14, -0.33)],
      collisions: true,
      texture: 'playerlowerleg',
      texture_size: {
        x: 0.40,
        y: 0.66
      }
    };

    Constants.upper_leg = {
      density: 0.4,
      restitution: 0.0,
      friction: 1.0,
      position: {
        x: -0.15,
        y: 1.27
      },
      angle: -Math.PI / 11.0,
      shape: [new b2Vec2(0.4, -0.14), new b2Vec2(0.4, 0.07), new b2Vec2(-0.4, 0.14), new b2Vec2(-0.4, -0.08)],
      collisions: true,
      texture: 'playerupperleg',
      texture_size: {
        x: 0.78,
        y: 0.28
      }
    };

    Constants.lower_arm = {
      density: 0.4,
      restitution: 0.0,
      friction: 1.0,
      position: {
        x: 0.07,
        y: 1.54
      },
      angle: -Math.PI / 10.0,
      shape: [new b2Vec2(0.28, -0.07), new b2Vec2(0.28, 0.04), new b2Vec2(-0.30, 0.07), new b2Vec2(-0.30, -0.06)],
      collisions: true,
      texture: 'playerlowerarm',
      texture_size: {
        x: 0.53,
        y: 0.20
      }
    };

    Constants.upper_arm = {
      density: 0.4,
      restitution: 0.0,
      friction: 1.0,
      position: {
        x: -0.20,
        y: 1.85
      },
      angle: Math.PI / 10.0,
      shape: [new b2Vec2(0.09, -0.29), new b2Vec2(0.09, 0.22), new b2Vec2(-0.11, 0.26), new b2Vec2(-0.10, -0.29)],
      collisions: true,
      texture: 'playerupperarm',
      texture_size: {
        x: 0.24,
        y: 0.56
      }
    };

    Constants.left_suspension = {
      angle: new b2Vec2(0, 1),
      lower_translation: -0.03,
      upper_translation: 0.20,
      back_force: 3.00,
      rigidity: 8.00
    };

    Constants.right_suspension = {
      angle: new b2Vec2(-0.2, 1),
      lower_translation: -0.01,
      upper_translation: 0.20,
      back_force: 3.00,
      rigidity: 4.00
    };

    Constants.ankle = {
      axe_position: {
        x: -0.18,
        y: -0.2
      }
    };

    Constants.wrist = {
      axe_position: {
        x: 0.25,
        y: -0.07
      }
    };

    Constants.knee = {
      axe_position: {
        x: 0.12,
        y: 0.28
      }
    };

    Constants.elbow = {
      axe_position: {
        x: 0.03,
        y: -0.21
      }
    };

    Constants.shoulder = {
      axe_position: {
        x: -0.12,
        y: 0.22
      }
    };

    Constants.hip = {
      axe_position: {
        x: -0.25,
        y: 0.14
      }
    };

    Constants.ground = {
      density: 1.0,
      restitution: 0.2,
      friction: 1.2
    };

    Constants.chain_reaction = function() {
      var element, j, len, ref, results;
      if (this.hooking === true) {
        ref = ['body', 'left_axle', 'right_axle', 'torso', 'lower_leg', 'upper_leg', 'lower_arm', 'upper_arm'];
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          element = ref[j];
          results.push(Constants[element].collisions = false);
        }
        return results;
      }
    };

    Constants.chain_reaction();

    return Constants;

  })();

  Input = (function() {
    function Input(level) {
      this.level = level;
      this.assets = level.assets;
      this.up = false;
      this.down = false;
      this.left = false;
      this.right = false;
      this.space = false;
    }

    Input.prototype.init = function() {
      this.disable_scroll();
      return this.init_keyboard();
    };

    Input.prototype.disable_scroll = function() {
      var keydown, keys, preventDefault;
      keys = [37, 38, 39, 40, 32];
      preventDefault = function(e) {
        e = e || window.event;
        if (e.preventDefault) {
          return e.preventDefault();
        } else {
          return e.returnValue = false;
        }
      };
      keydown = function(e) {
        var i, j, len;
        for (j = 0, len = keys.length; j < len; j++) {
          i = keys[j];
          if (e.keyCode === i) {
            preventDefault(e);
            return;
          }
        }
      };
      return document.onkeydown = keydown;
    };

    Input.prototype.init_keyboard = function() {
      $(document).off('keydown');
      $(document).on('keydown', (function(_this) {
        return function(event) {
          var url;
          switch (event.which || event.keyCode) {
            case 38:
              return _this.up = true;
            case 40:
              return _this.down = true;
            case 37:
              return _this.left = true;
            case 39:
              return _this.right = true;
            case 32:
              return _this.space = true;
            case 13:
              return _this.level.need_to_restart = true;
            case 69:
              if (!$('input').is(':focus')) {
                return _this.level.moto.rider.eject();
              }
              break;
          }
        };
      })(this));
      return $(document).on('keyup', (function(_this) {
        return function(event) {
          switch (event.which || event.keyCode) {
            case 38:
              return _this.up = false;
            case 40:
              return _this.down = false;
            case 37:
              return _this.left = false;
            case 39:
              return _this.right = false;
          }
        };
      })(this));
    };

    return Input;

  })();

  b2AABB = Box2D.Collision.b2AABB;

  b2Vec2 = Box2D.Common.Math.b2Vec2;

  Level = (function() {
    function Level(renderer, options) {
      this.renderer = renderer;
      this.options = options;
      this.stage = new PIXI.Container();
      this.assets = new Assets();
      this.camera = new Camera(this);
      this.physics = new Physics(this);
      this.input = new Input(this);
      this.listeners = new Listeners(this);
      this.moto = new Moto(this);
      this.infos = new Infos(this);
      this.sky = new Sky(this);
      this.blocks = new Blocks(this);
      this.limits = new Limits(this);
      this.layer_offsets = new LayerOffsets(this);
      this.entities = new Entities(this);
    }

    Level.prototype.load_from_file = function(filename, callback) {
      // Load theme data
      this.assets.parse_theme(THEME_JSON);
      // Load the level data
      return $.ajax({
        type: "GET",
        url: this.options.levels_path + "/" + filename,
        dataType: "xml",
        success: function(xml) {
          return this.load_level(xml, callback);
        },
        context: this
      });
    };

    Level.prototype.load_level = function(xml, callback) {
      this.infos.parse(xml);
      this.sky.parse(xml);
      this.blocks.parse(xml);
      this.limits.parse(xml);
      this.layer_offsets.parse(xml);
      this.entities.parse(xml);
      this.sky.load_assets();
      this.blocks.load_assets();
      this.limits.load_assets();
      this.entities.load_assets();
      this.moto.load_assets();
      return this.assets.load(callback);
    };

    Level.prototype.init = function() {
      this.sky.init();
      this.blocks.init();
      this.limits.init();
      this.entities.init();
      this.moto.init();
      this.physics.init();
      this.input.init();
      this.camera.init();
      this.listeners.init();
      return this.init_timer();
    };

    Level.prototype.update = function() {
      var dead_player;
      this.physics.update();
      dead_player = !this.moto.dead;
      if (dead_player) {
        this.update_timer();
      }
      this.sky.update();
      this.limits.update();
      this.entities.update();
      this.camera.update();
      this.blocks.update();
      this.moto.update();
    };

    Level.prototype.init_timer = function() {
      this.start_time = new Date().getTime();
      return this.current_time = 0;
    };

    Level.prototype.update_timer = function(update_now) {
      var cents, minutes, new_time, seconds;
      if (update_now == null) {
        update_now = false;
      }
      new_time = new Date().getTime() - this.start_time;
      if (update_now || Math.floor(new_time / 10) > Math.floor(this.current_time / 10)) {
        minutes = Math.floor(new_time / 1000 / 60);
        seconds = Math.floor(new_time / 1000) % 60;
        if (seconds < 10) {
          seconds = "0" + seconds;
        }
        cents = Math.floor(new_time / 10) % 100;
        if (cents < 10) {
          cents = "0" + cents;
        }
        $(this.options.chrono).text(minutes + ":" + seconds + ":" + cents);
      }
      return this.current_time = new_time;
    };

    Level.prototype.got_coins = function() {
      var j, len, ref, coin;
      ref = this.entities.coins;
      for (j = 0, len = ref.length; j < len; j++) {
        coin = ref[j];
        if (coin.display) {
          return false;
        }
      }
      return true;
    };

    Level.prototype.respawn_coins = function() {
      var entity, j, len, ref, results;
      ref = this.entities.coins;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        entity = ref[j];
        results.push(entity.display = true);
      }
      return results;
    };

    Level.prototype.restart = function() {
      this.moto.destroy();
      this.moto = new Moto(this);
      this.moto.init();
      this.respawn_coins();
      this.init_timer();
      return this.update_timer(true);
    };

    return Level;

  })();

  Listeners = (function() {
    function Listeners(level) {
      this.level = level;
      this.assets = level.assets;
      this.world = level.physics.world;
    }

    Listeners.prototype.active_moto = function() {
      return this.level.moto;
    };

    Listeners.prototype.init = function() {
      var listener;
      listener = new Box2D.Dynamics.b2ContactListener;
      listener.BeginContact = (function(_this) {
        return function(contact) {
          var a, b, entity, moto, coin;
          moto = _this.active_moto();
          a = contact.GetFixtureA().GetBody().GetUserData();
          b = contact.GetFixtureB().GetBody().GetUserData();
          if (!moto.dead) {
            if (Listeners.does_contact_moto_rider(a, b, 'coin')) {
              console.log('got coin');
              coin = a.name === 'coin' ? contact.GetFixtureA() : contact.GetFixtureB();
              entity = coin.GetBody().GetUserData().entity;
              if (entity.display) {
                return entity.display = false;
              }
            } else if (Listeners.does_contact_moto_rider(a, b, 'end_of_level') && !_this.level.need_to_restart) {
              if (_this.level.got_coins()) {
                if (a.name === 'rider' || b.name === 'rider') {
                  moto = a.name === 'rider' ? a.rider.moto : b.rider.moto;
                } else {
                  moto = a.name === 'moto' ? a.moto : b.moto;
                }
                return _this.trigger_restart(moto);
              }
            } else if (Constants.hooking === false && Listeners.does_contact(a, b, 'rider', 'ground') && a.part !== 'lower_leg' && b.part !== 'lower_leg') {
              moto = a.name === 'rider' ? a.rider.moto : b.rider.moto;
              return _this.kill_moto(moto);
            } else if (Constants.hooking === true && Listeners.does_contact(a, b, 'rider', 'ground') && (a.part === 'head' || b.part === 'head')) {
              moto = a.name === 'rider' ? a.rider.moto : b.rider.moto;
              return _this.kill_moto(moto);
            } else if (Listeners.does_contact_moto_rider(a, b, 'wrecker')) {
              if (a.name === 'rider' || b.name === 'rider') {
                moto = a.name === 'rider' ? a.rider.moto : b.rider.moto;
              } else {
                moto = a.name === 'moto' ? a.moto : b.moto;
              }
              return _this.kill_moto(moto);
            }
          }
        };
      })(this);
      return this.world.SetContactListener(listener);
    };

    Listeners.does_contact_moto_rider = function(a, b, obj) {
      var collision, player;
      collision = Listeners.does_contact(a, b, obj, 'rider') || Listeners.does_contact(a, b, obj, 'moto');
      player = a.type === 'player' || b.type === 'player';
      return collision && player;
    };

    Listeners.does_contact = function(a, b, obj1, obj2) {
      return (a.name === obj1 && b.name === obj2) || (a.name === obj2 && b.name === obj1);
    };

    Listeners.prototype.trigger_restart = function(moto) {
      console.log("WIN!");
      return this.level.need_to_restart = true;
    };

    Listeners.prototype.kill_moto = function(moto) {
      if (!moto.dead) {
        moto.dead = true;
        this.world.DestroyJoint(moto.rider.ankle_joint);
        this.world.DestroyJoint(moto.rider.wrist_joint);
        moto.rider.shoulder_joint.m_enableLimit = false;
        moto.rider.knee_joint.m_lowerAngle = moto.rider.knee_joint.m_lowerAngle * 3;
        moto.rider.elbow_joint.m_upperAngle = moto.rider.elbow_joint.m_upperAngle * 3;
        return moto.rider.hip_joint.m_lowerAngle = moto.rider.hip_joint.m_lowerAngle * 3;
      }
    };

    return Listeners;

  })();

  $.xmoto = function(level_filename, options) {
    var bind_render_to_dom, initialize, load_options, main_loop;
    if (options == null) {
      options = {};
    }
    initialize = function() {
      var renderer;
      options = load_options(options);
      PIXI.settings.MIPMAP_TEXTURES = PIXI.MIPMAP_MODES.OFF;
      renderer = new PIXI.Renderer({
        width: options.width,
        height: options.height,
        backgroundColor: 0xFFFFFF,
        clearBeforeRender: false,
        preserveDrawingBuffer: true
      });
      window.cancelAnimationFrame(window.game_loop);
      bind_render_to_dom(renderer, options);
      return main_loop(level_filename, renderer, options);
    };
    load_options = function(options) {
      var defaults;
      defaults = {
        canvas: '#xmoto',
        loading: '#loading',
        chrono: '#chrono',
        width: 800,
        height: 600,
        zoom: Constants.default_scale.x,
        levels_path: 'data/Levels'
      };
      options = $.extend(defaults, options);
      Constants.default_scale = {
        x: options.zoom,
        y: -options.zoom
      };
      return options;
    };
    bind_render_to_dom = function(renderer, options) {
      $("#xmoto canvas").remove();
      $(options.loading).show();
      $('#xmoto').css('height', options.height);
      $('#xmoto')[0].appendChild(renderer.view);
    };
    main_loop = function(level_filename, renderer, options) {
      var level;
      level = new Level(renderer, options);
      return level.load_from_file(level_filename, (function(_this) {
        return function() {
          var update;
          level.init(renderer);
          $(options.loading).hide();
          update = function() {
            level.update();
            renderer.render(level.stage);
            window.game_loop = requestAnimationFrame(update);
          };
          return update();
        };
      })(this));
    };
    return initialize();
  };

  b2World = Box2D.Dynamics.b2World;

  b2Vec2 = Box2D.Common.Math.b2Vec2;

  b2AABB = Box2D.Collision.b2AABB;

  b2BodyDef = Box2D.Dynamics.b2BodyDef;

  b2Body = Box2D.Dynamics.b2Body;

  b2FixtureDef = Box2D.Dynamics.b2FixtureDef;

  b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;

  b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;

  b2Settings = Box2D.Common.b2Settings;

  Physics = (function() {
    function Physics(level) {
      this.level = level;
      this.options = level.options;
      this.camera = level.camera;
      this.world = new b2World(new b2Vec2(0, -Constants.gravity), true);
      b2Settings.b2_linearSlop = 0.0025;
      this.world;
    }

    Physics.prototype.init = function() {
      this.last_step = new Date().getTime();
      this.step = 1000.0 / Constants.fps;
      return this.steps = 0;
    };

    Physics.prototype.restart = function() {
      this.level.restart();
      return this.init();
    };

    Physics.prototype.update = function() {
      var results;
      results = [];
      while ((new Date()).getTime() - this.last_step > this.step) {
        this.steps = this.steps + 1;
        this.last_step += this.step;
        this.level.moto.move();
        this.level.camera.move();
        this.world.Step(1.0 / Constants.fps, 10, 10);
        this.world.ClearForces();
        this.level.input.space = false;
        if (this.level.need_to_restart) {
          this.restart();
          results.push(this.level.need_to_restart = false);
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    Physics.prototype.create_polygon = function(vertices, name, density, restitution, friction, group_index) {
      var bodyDef, fixDef;
      if (density == null) {
        density = 1.0;
      }
      if (restitution == null) {
        restitution = 0.5;
      }
      if (friction == null) {
        friction = 1.0;
      }
      if (group_index == null) {
        group_index = -2;
      }
      fixDef = new b2FixtureDef();
      fixDef.shape = new b2PolygonShape();
      fixDef.density = density;
      fixDef.restitution = restitution;
      fixDef.friction = friction;
      fixDef.filter.groupIndex = group_index;
      Physics.create_shape(fixDef, vertices);
      bodyDef = new b2BodyDef();
      bodyDef.position.x = 0;
      bodyDef.position.y = 0;
      bodyDef.userData = {
        name: name
      };
      bodyDef.type = b2Body.b2_staticBody;
      return this.world.CreateBody(bodyDef).CreateFixture(fixDef);
    };

    Physics.prototype.create_lines = function(block, name, density, restitution, friction, group_index) {
      var body, bodyDef, fixDef, i, j, len, ref, results, vertex, vertex1, vertex2;
      if (density == null) {
        density = 1.0;
      }
      if (restitution == null) {
        restitution = 0.5;
      }
      if (friction == null) {
        friction = 1.0;
      }
      if (group_index == null) {
        group_index = -2;
      }
      bodyDef = new b2BodyDef();
      bodyDef.position.x = block.position.x;
      bodyDef.position.y = block.position.y;
      bodyDef.userData = {
        name: name
      };
      bodyDef.type = b2Body.b2_staticBody;
      body = this.world.CreateBody(bodyDef);
      ref = block.vertices;
      results = [];
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        vertex = ref[i];
        fixDef = new b2FixtureDef();
        fixDef.shape = new b2PolygonShape();
        fixDef.density = density;
        fixDef.restitution = restitution;
        fixDef.friction = friction;
        fixDef.filter.groupIndex = group_index;
        vertex1 = vertex;
        vertex2 = i === block.vertices.length - 1 ? block.vertices[0] : block.vertices[i + 1];
        fixDef.shape.SetAsArray([new b2Vec2(vertex1.x, vertex1.y), new b2Vec2(vertex2.x, vertex2.y)], 2);
        results.push(body.CreateFixture(fixDef));
      }
      return results;
    };

    Physics.create_shape = function(fix_def, shape, mirror) {
      var b2vertices, j, k, len, len1, vertex;
      if (mirror == null) {
        mirror = false;
      }
      b2vertices = [];
      if (mirror === false) {
        for (j = 0, len = shape.length; j < len; j++) {
          vertex = shape[j];
          b2vertices.push(new b2Vec2(vertex.x, vertex.y));
        }
      } else {
        for (k = 0, len1 = shape.length; k < len1; k++) {
          vertex = shape[k];
          b2vertices.unshift(new b2Vec2(-vertex.x, vertex.y));
        }
      }
      return fix_def.shape.SetAsArray(b2vertices);
    };

    return Physics;

  })();

  b2Vec2 = Box2D.Common.Math.b2Vec2;

  b2AABB = Box2D.Collision.b2AABB;

  Blocks = (function() {
    function Blocks(level) {
      this.level = level;
      this.assets = level.assets;
      this.theme = this.assets.theme;
      this.list = [];
      this.back_list = [];
      this.front_list = [];
      this.edges = new Edges(this.level);
    }

    Blocks.prototype.parse = function(xml) {
      var block, j, k, l, len, len1, len2, material, vertex, xml_block, xml_blocks, xml_material, xml_materials, xml_vertex, xml_vertices;
      xml_blocks = $(xml).find('block');
      for (j = 0, len = xml_blocks.length; j < len; j++) {
        xml_block = xml_blocks[j];
        block = {
          id: $(xml_block).attr('id'),
          position: {
            x: parseFloat($(xml_block).find('position').attr('x')),
            y: parseFloat($(xml_block).find('position').attr('y')),
            dynamic: $(xml_block).find('position').attr('dynamic') === 'true',
            background: $(xml_block).find('position').attr('background') === 'true'
          },
          usetexture: {
            id: $(xml_block).find('usetexture').attr('id').toLowerCase(),
            scale: parseFloat($(xml_block).find('usetexture').attr('scale'))
          },
          physics: {
            grip: parseFloat($(xml_block).find('physics').attr('grip'))
          },
          edges: {
            angle: parseFloat($(xml_block).find('edges').attr('angle')),
            materials: []
          },
          vertices: []
        };
        if (block.usetexture.id === 'default') {
          block.usetexture.id = 'dirt';
        }
        block.texture_name = this.theme.texture_params(block.usetexture.id).file;
        xml_materials = $(xml_block).find('edges material');
        for (k = 0, len1 = xml_materials.length; k < len1; k++) {
          xml_material = xml_materials[k];
          material = {
            name: $(xml_material).attr('name'),
            edge: $(xml_material).attr('edge'),
            color_r: parseInt($(xml_material).attr('color_r')),
            color_g: parseInt($(xml_material).attr('color_g')),
            color_b: parseInt($(xml_material).attr('color_b')),
            color_a: parseInt($(xml_material).attr('color_a')),
            scale: parseFloat($(xml_material).attr('scale')),
            depth: parseFloat($(xml_material).attr('depth'))
          };
          block.edges.materials.push(material);
        }
        xml_vertices = $(xml_block).find('vertex');
        for (l = 0, len2 = xml_vertices.length; l < len2; l++) {
          xml_vertex = xml_vertices[l];
          vertex = {
            x: parseFloat($(xml_vertex).attr('x')),
            y: parseFloat($(xml_vertex).attr('y')),
            absolute_x: parseFloat($(xml_vertex).attr('x')) + block.position.x,
            absolute_y: parseFloat($(xml_vertex).attr('y')) + block.position.y,
            edge: $(xml_vertex).attr('edge') ? $(xml_vertex).attr('edge').toLowerCase() : void 0
          };
          block.vertices.push(vertex);
        }
        block.edges_list = new Edges(this.level, block);
        block.edges_list.parse();
        block.aabb = this.compute_aabb(block);
        this.list.push(block);
        if (block.position.background) {
          this.back_list.push(block);
        } else {
          this.front_list.push(block);
        }
      }
      this.list.sort(this.sort_blocks_by_texture);
      this.back_list.sort(this.sort_blocks_by_texture);
      this.front_list.sort(this.sort_blocks_by_texture);
      return this;
    };

    Blocks.prototype.load_assets = function() {
      var block, j, len, ref, results;
      ref = this.list;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        block = ref[j];
        this.assets.textures.push(block.texture_name);
        results.push(block.edges_list.load_assets());
      }
      return results;
    };

    Blocks.prototype.init = function() {
      var block, j, len, ref, results;
      this.init_physics_parts();
      this.init_sprites();
      ref = this.list;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        block = ref[j];
        results.push(block.edges_list.init());
      }
      return results;
    };

    Blocks.prototype.init_physics_parts = function() {
      var block, ground, j, len, ref, results;
      ground = Constants.ground;
      ref = this.front_list;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        block = ref[j];
        results.push(this.level.physics.create_lines(block, 'ground', ground.density, ground.restitution, ground.friction));
      }
      return results;
    };

    Blocks.prototype.init_sprites = function() {
      var block, j, k, len, len1, mask, points, ref, ref1, results, size_x, size_y, texture, vertex;
      ref = this.back_list.concat(this.front_list);
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        block = ref[j];
        points = [];
        ref1 = block.vertices;
        for (k = 0, len1 = ref1.length; k < len1; k++) {
          vertex = ref1[k];
          points.push(new PIXI.Point(vertex.x, -vertex.y));
        }
        mask = new PIXI.Graphics();
        mask.beginFill(0xffffff, 1.0);
        mask.drawPolygon(points);
        mask.x = block.position.x;
        mask.y = -block.position.y;
        this.level.camera.neutral_z_container.addChild(mask);
        texture = PIXI.Texture.from(this.assets.get_url(block.texture_name));
        size_x = block.aabb.upperBound.x - block.aabb.lowerBound.x;
        size_y = block.aabb.upperBound.y - block.aabb.lowerBound.y;
        block.sprite = new PIXI.TilingSprite(texture, size_x, size_y);
        block.sprite.x = block.aabb.lowerBound.x;
        block.sprite.y = -block.aabb.upperBound.y;
        block.sprite.tileScale.x = 1.0 / 40;
        block.sprite.tileScale.y = 1.0 / 40;
        block.sprite.mask = mask;
        results.push(this.level.camera.neutral_z_container.addChild(block.sprite));
      }
      return results;
    };

    Blocks.prototype.update = function() {
      var block, j, len, ref, results;
      ref = this.list;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        block = ref[j];
        block.sprite.visible = this.visible(block);
        results.push(block.edges_list.update());
      }
      return results;
    };

    Blocks.prototype.visible = function(block) {
      return block.aabb.TestOverlap(this.level.camera.aabb);
    };

    Blocks.prototype.compute_aabb = function(block) {
      var aabb, first, j, len, lower_bound, ref, upper_bound, vertex;
      first = true;
      lower_bound = {};
      upper_bound = {};
      ref = block.vertices;
      for (j = 0, len = ref.length; j < len; j++) {
        vertex = ref[j];
        if (first) {
          lower_bound = {
            x: vertex.absolute_x,
            y: vertex.absolute_y
          };
          upper_bound = {
            x: vertex.absolute_x,
            y: vertex.absolute_y
          };
          first = false;
        } else {
          if (vertex.absolute_x < lower_bound.x) {
            lower_bound.x = vertex.absolute_x;
          }
          if (vertex.absolute_y < lower_bound.y) {
            lower_bound.y = vertex.absolute_y;
          }
          if (vertex.absolute_x > upper_bound.x) {
            upper_bound.x = vertex.absolute_x;
          }
          if (vertex.absolute_y > upper_bound.y) {
            upper_bound.y = vertex.absolute_y;
          }
        }
      }
      aabb = new b2AABB();
      aabb.lowerBound.Set(lower_bound.x, lower_bound.y);
      aabb.upperBound.Set(upper_bound.x, upper_bound.y);
      return aabb;
    };

    Blocks.prototype.sort_blocks_by_texture = function(a, b) {
      if (a.usetexture.id > b.usetexture.id) {
        return 1;
      }
      if (a.usetexture.id <= b.usetexture.id) {
        return -1;
      }
      return 0;
    };

    return Blocks;

  })();

  b2Vec2 = Box2D.Common.Math.b2Vec2;

  b2AABB = Box2D.Collision.b2AABB;

  Edges = (function() {
    function Edges(level, block) {
      this.level = level;
      this.block = block;
      this.assets = this.level.assets;
      this.theme = this.assets.theme;
      this.list = [];
    }

    Edges.prototype.parse = function() {
      var edge, i, j, len, ref, results, vertex;
      ref = this.block.vertices;
      results = [];
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        vertex = ref[i];
        if (vertex.edge) {
          edge = {
            vertex1: vertex,
            vertex2: i === this.block.vertices.length - 1 ? this.block.vertices[0] : this.block.vertices[i + 1],
            block: this.block,
            texture: vertex.edge,
            theme: this.theme.edge_params(vertex.edge)
          };
          edge.angle = Math2D.angle_between_points(edge.vertex1, edge.vertex2) - Math.PI / 2;
          edge.vertices = [
            {
              x: edge.vertex1.absolute_x,
              y: edge.vertex1.absolute_y - edge.theme.depth
            }, {
              x: edge.vertex2.absolute_x,
              y: edge.vertex2.absolute_y - edge.theme.depth
            }, {
              x: edge.vertex2.absolute_x,
              y: edge.vertex2.absolute_y
            }, {
              x: edge.vertex1.absolute_x,
              y: edge.vertex1.absolute_y
            }
          ];
          edge.aabb = this.compute_aabb(edge);
          results.push(this.list.push(edge));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    Edges.prototype.load_assets = function() {
      var edge, j, len, ref, results;
      ref = this.list;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        edge = ref[j];
        results.push(this.assets.effects.push(edge.theme.file));
      }
      return results;
    };

    Edges.prototype.init = function() {
      return this.init_sprites();
    };

    Edges.prototype.init_sprites = function() {
      var edge, j, k, len, len1, mask, points, ref, ref1, results, size_x, size_y, texture, vertex, x, y;
      ref = this.list;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        edge = ref[j];
        points = [];
        ref1 = edge.vertices;
        for (k = 0, len1 = ref1.length; k < len1; k++) {
          vertex = ref1[k];
          points.push(new PIXI.Point(vertex.x, -vertex.y));
        }
        mask = new PIXI.Graphics();
        mask.beginFill(0xffffff, 1.0);
        mask.drawPolygon(points);
        this.level.camera.neutral_z_container.addChild(mask);
        x = Math.abs(Math.sin(edge.angle) * edge.theme.depth);
        y = Math.abs(Math.tan(edge.angle) * x);
        texture = PIXI.Texture.from(this.assets.get_url(edge.theme.file));
        size_x = edge.aabb.upperBound.x - edge.aabb.lowerBound.x + 2 * x;
        size_y = edge.theme.depth;
        edge.sprite = new PIXI.TilingSprite(texture, 4 * size_x, size_y);
        edge.sprite.x = edge.vertex1.absolute_x - x;
        if (edge.angle > 0) {
          edge.sprite.y = -edge.vertex1.absolute_y + y;
        }
        if (edge.angle <= 0) {
          edge.sprite.y = -edge.vertex1.absolute_y - y;
        }
        edge.sprite.pivot.x = 0.5;
        edge.sprite.tileScale.x = 1.0 / 100.0;
        edge.sprite.tileScale.y = 1.0 / 100.0;
        edge.sprite.mask = mask;
        edge.sprite.rotation = -edge.angle;
        results.push(this.level.camera.neutral_z_container.addChild(edge.sprite));
      }
      return results;
    };

    Edges.prototype.update = function() {
      var block_visible, edge, j, len, ref, results;
      block_visible = this.block.sprite.visible;
      ref = this.list;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        edge = ref[j];
        results.push(edge.sprite.visible = block_visible && this.visible(edge));
      }
      return results;
    };

    Edges.prototype.compute_aabb = function(edge) {
      var aabb, first, j, len, lower_bound, ref, upper_bound, vertex;
      first = true;
      lower_bound = {};
      upper_bound = {};
      ref = edge.vertices;
      for (j = 0, len = ref.length; j < len; j++) {
        vertex = ref[j];
        if (first) {
          lower_bound = {
            x: vertex.x,
            y: vertex.y
          };
          upper_bound = {
            x: vertex.x,
            y: vertex.y
          };
          first = false;
        } else {
          if (vertex.x < lower_bound.x) {
            lower_bound.x = vertex.x;
          }
          if (vertex.y < lower_bound.y) {
            lower_bound.y = vertex.y;
          }
          if (vertex.x > upper_bound.x) {
            upper_bound.x = vertex.x;
          }
          if (vertex.y > upper_bound.y) {
            upper_bound.y = vertex.y;
          }
        }
      }
      aabb = new b2AABB();
      aabb.lowerBound.Set(lower_bound.x, lower_bound.y);
      aabb.upperBound.Set(upper_bound.x, upper_bound.y);
      return aabb;
    };

    Edges.prototype.visible = function(edge) {
      return edge.aabb.TestOverlap(this.level.camera.aabb);
    };

    return Edges;

  })();

  b2FixtureDef = Box2D.Dynamics.b2FixtureDef;

  Entities = (function() {
    function Entities(level) {
      this.level = level;
      this.assets = level.assets;
      this.world = level.physics.world;
      this.list = [];
      this.coins = [];
      this.wreckers = [];
    }

    Entities.prototype.parse = function(xml) {
      var entity, j, k, len, len1, name, sprite, texture_name, value, xml_entities, xml_entity, xml_param, xml_params;
      xml_entities = $(xml).find('entity');
      for (j = 0, len = xml_entities.length; j < len; j++) {
        xml_entity = xml_entities[j];
        entity = {
          id: $(xml_entity).attr('id'),
          type_id: $(xml_entity).attr('typeid'),
          size: {
            r: parseFloat($(xml_entity).find('size').attr('r')),
            z: parseInt($(xml_entity).find('size').attr('z')) || void 0,
            width: parseFloat($(xml_entity).find('size').attr('width')),
            height: parseFloat($(xml_entity).find('size').attr('height'))
          },
          position: {
            x: parseFloat($(xml_entity).find('position').attr('x')),
            y: parseFloat($(xml_entity).find('position').attr('y')),
            angle: parseFloat($(xml_entity).find('position').attr('angle')) || 0
          },
          params: {}
        };
        xml_params = $(xml_entity).find('param');
        for (k = 0, len1 = xml_params.length; k < len1; k++) {
          xml_param = xml_params[k];
          name = $(xml_param).attr('name');
          value = $(xml_param).attr('value');
          entity.params[name] = value;
        }
        entity['z'] = entity.size.z || parseInt(entity.params.z) || 0;
        texture_name = this.entity_texture_name(entity);
        if (texture_name) {
          sprite = this.assets.theme.sprite_params(texture_name);
          entity.file = sprite.file;
          entity.file_base = sprite.file_base;
          entity.file_ext = sprite.file_ext;
          if (!entity.size.width) {
            entity.size.width = sprite.size.width;
          }
          if (!entity.size.height) {
            entity.size.height = sprite.size.height;
          }
          entity.center = {
            x: sprite.center.x,
            y: sprite.center.y
          };
          if (!entity.center.x) {
            entity.center.x = entity.size.width / 2;
          }
          if (!entity.center.y) {
            entity.center.y = entity.size.height / 2;
          }
          if (!entity.size.width) {
            entity.size.width = 2 * entity.size.r;
          }
          if (!entity.size.height) {
            entity.size.height = 2 * entity.size.r;
          }
          if (!entity.center.x) {
            entity.center.x = entity.size.r;
          }
          if (!entity.center.y) {
            entity.center.y = entity.size.r;
          }
          entity.delay = sprite.delay;
          entity.frames = sprite.frames;
          entity.display = true;
          entity.aabb = this.compute_aabb(entity);
        }
        this.list.push(entity);
      }
      this.list.sort(function(a, b) {
        if (a.z > b.z) {
          return 1;
        }
        if (a.z < b.z) {
          return -1;
        }
        return 0;
      });
      return this;
    };

    Entities.prototype.load_assets = function() {
      var entity, i, j, len, ref, results;
      ref = this.list;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        entity = ref[j];
        if (entity.display) {
          if (entity.frames === 0) {
            results.push(this.assets.anims.push(entity.file));
          } else {
            results.push((function() {
              var k, ref1, results1;
              results1 = [];
              for (i = k = 0, ref1 = entity.frames - 1; 0 <= ref1 ? k <= ref1 : k >= ref1; i = 0 <= ref1 ? ++k : --k) {
                results1.push(this.assets.anims.push(this.frame_name(entity, i)));
              }
              return results1;
            }).call(this));
          }
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    Entities.prototype.init = function() {
      this.init_physics_parts();
      return this.init_sprites();
    };

    Entities.prototype.init_physics_parts = function() {
      var entity, j, len, ref, results;
      ref = this.list;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        entity = ref[j];
        if (entity.type_id === 'EndOfLevel') {
          this.create_entity(entity, 'end_of_level');
          results.push(this.end_of_level = entity);
        } else if (entity.type_id === 'Coin') {
          this.create_entity(entity, 'coin');
          results.push(this.coins.push(entity));
        } else if (entity.type_id === 'Wrecker') {
          this.create_entity(entity, 'wrecker');
          results.push(this.wreckers.push(entity));
        } else if (entity.type_id === 'PlayerStart') {
          results.push(this.player_start = {
            x: entity.position.x,
            y: entity.position.y
          });
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    Entities.prototype.init_sprites = function() {
      var entity, j, len, ref, results;
      ref = this.list;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        entity = ref[j];
        if (entity.z < 0) {
          results.push(this.init_entity(entity, this.level.camera.negative_z_container));
        } else if (entity.z > 0) {
          results.push(this.init_entity(entity, this.level.camera.positive_z_container));
        } else if (entity.z === 0) {
          results.push(this.init_entity(entity, this.level.camera.neutral_z_container));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    Entities.prototype.init_entity = function(entity, container) {
      var i, j, ref, textures;
      if (entity.frames > 0) {
        textures = [];
        for (i = j = 0, ref = entity.frames - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
          textures.push(PIXI.Texture.from(this.assets.get_url(this.frame_name(entity, i))));
        }
        entity.sprite = new PIXI.AnimatedSprite(textures);
        entity.sprite.animationSpeed = 0.5 - 0.5 * entity.delay;
        entity.sprite.play();
        container.addChild(entity.sprite);
      } else if (entity.file) {
        entity.sprite = new PIXI.Sprite.from(this.assets.get_url(entity.file));
        container.addChild(entity.sprite);
      }
      if (entity.sprite) {
        entity.sprite.width = entity.size.width;
        entity.sprite.height = entity.size.height;
        entity.sprite.anchor.x = entity.center.x / entity.size.width;
        entity.sprite.anchor.y = 1 - (entity.center.y / entity.size.height);
        entity.sprite.x = entity.position.x;
        entity.sprite.y = -entity.position.y;
        return entity.sprite.rotation = -entity.position.angle;
      }
    };

    Entities.prototype.create_entity = function(entity, name) {
      var body, bodyDef, fixDef;
      fixDef = new b2FixtureDef();
      fixDef.shape = new b2CircleShape(entity.size.r);
      fixDef.isSensor = true;
      bodyDef = new b2BodyDef();
      bodyDef.position.x = entity.position.x;
      bodyDef.position.y = entity.position.y;
      bodyDef.userData = {
        name: name,
        entity: entity
      };
      bodyDef.type = b2Body.b2_staticBody;
      body = this.world.CreateBody(bodyDef);
      body.CreateFixture(fixDef);
      return body;
    };

    Entities.prototype.update = function(entity) {
      var j, len, ref, results;
      ref = this.list;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        entity = ref[j];
        if (entity.sprite) {
          results.push(entity.sprite.visible = this.visible(entity));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    Entities.prototype.entity_texture_name = function(entity) {
      if (entity.type_id === 'Sprite') {
        return entity.params.name;
      } else if (entity.type_id === 'EndOfLevel') {
        return 'Finish';
      } else if (entity.type_id === 'Coin' || entity.type_id === 'Wrecker') {
        return entity.type_id;
      }
    };

    Entities.prototype.compute_aabb = function(entity) {
      var aabb, lower_bound, upper_bound;
      lower_bound = {
        x: entity.position.x - entity.size.width + entity.center.x,
        y: entity.position.y - entity.center.y
      };
      upper_bound = {
        x: lower_bound.x + entity.size.width,
        y: lower_bound.y + entity.size.height
      };
      aabb = new b2AABB();
      aabb.lowerBound.Set(lower_bound.x, lower_bound.y);
      aabb.upperBound.Set(upper_bound.x, upper_bound.y);
      return aabb;
    };

    Entities.prototype.visible = function(entity) {
      return entity.aabb.TestOverlap(this.level.camera.aabb) && entity.display;
    };

    Entities.prototype.frame_name = function(entity, frame_number) {
      return "" + entity.file_base + ((frame_number / 100.0).toFixed(2).toString().substring(2)) + "." + entity.file_ext;
    };

    return Entities;

  })();

  Infos = (function() {
    function Infos(level) {
      this.level = level;
      this.assets = level.assets;
    }

    Infos.prototype.parse = function(xml) {
      var xml_border, xml_infos, xml_level;
      xml_level = $(xml).find('level');
      this.identifier = xml_level.attr('id');
      this.pack_name = xml_level.attr('levelpack');
      this.pack_id = xml_level.attr('levelpackNum');
      this.r_version = xml_level.attr('rversion');
      xml_infos = $(xml).find('level').find('info');
      this.name = xml_infos.find('name').text();
      this.description = xml_infos.find('description').text();
      this.author = xml_infos.find('author').text();
      this.date = xml_infos.find('date').text();
      xml_border = xml_infos.find('border');
      this.border = xml_border.attr('texture');
      return this;
    };

    return Infos;

  })();

  LayerOffsets = (function() {
    function LayerOffsets(level) {
      this.level = level;
      this.assets = level.assets;
      this.list = [];
    }

    LayerOffsets.prototype.parse = function(xml) {
      var j, layer_offset, len, xml_layer_offset, xml_layer_offsets;
      xml_layer_offsets = $(xml).find('layeroffsets layeroffset');
      for (j = 0, len = xml_layer_offsets.length; j < len; j++) {
        xml_layer_offset = xml_layer_offsets[j];
        layer_offset = {
          x: parseFloat($(xml_layer_offset).attr('x')),
          y: parseFloat($(xml_layer_offset).attr('y')),
          front_layer: $(xml_layer_offset).attr('frontlayer')
        };
        this.list.push(layer_offset);
      }
      return this;
    };

    LayerOffsets.prototype.init = function() {};

    LayerOffsets.prototype.display = function(ctx) {};

    return LayerOffsets;

  })();

  b2Vec2 = Box2D.Common.Math.b2Vec2;

  b2AABB = Box2D.Collision.b2AABB;

  Limits = (function() {
    function Limits(level) {
      this.level = level;
      this.assets = level.assets;
      this.theme = this.assets.theme;
    }

    Limits.prototype.parse = function(xml) {
      var xml_limits;
      xml_limits = $(xml).find('limits');
      this.player = {
        left: parseFloat(xml_limits.attr('left')),
        right: parseFloat(xml_limits.attr('right')),
        top: parseFloat(xml_limits.attr('top')),
        bottom: parseFloat(xml_limits.attr('bottom'))
      };
      this.screen = {
        left: parseFloat(xml_limits.attr('left')) - 20,
        right: parseFloat(xml_limits.attr('right')) + 20,
        top: parseFloat(xml_limits.attr('top')) + 20,
        bottom: parseFloat(xml_limits.attr('bottom')) - 20
      };
      this.size = {
        x: this.screen.right - this.screen.left,
        y: this.screen.top - this.screen.bottom
      };
      this.left_wall_aabb = new b2AABB();
      this.left_wall_aabb.lowerBound.Set(this.screen.left, this.screen.bottom);
      this.left_wall_aabb.upperBound.Set(this.player.left, this.screen.top);
      this.right_wall_aabb = new b2AABB();
      this.right_wall_aabb.lowerBound.Set(this.player.right, this.screen.bottom);
      this.right_wall_aabb.upperBound.Set(this.screen.right, this.screen.top);
      this.bottom_wall_aabb = new b2AABB();
      this.bottom_wall_aabb.lowerBound.Set(this.player.left, this.screen.bottom);
      this.bottom_wall_aabb.upperBound.Set(this.player.right, this.player.bottom);
      this.top_wall_aabb = new b2AABB();
      this.top_wall_aabb.lowerBound.Set(this.player.left, this.player.top);
      this.top_wall_aabb.upperBound.Set(this.player.right, this.screen.top);
      this.texture = 'dirt';
      this.texture_name = this.theme.texture_params('dirt').file;
      return this;
    };

    Limits.prototype.load_assets = function() {
      return this.assets.textures.push(this.texture_name);
    };

    Limits.prototype.init = function() {
      this.init_physics_parts();
      return this.init_sprites();
    };

    Limits.prototype.init_physics_parts = function() {
      var ground, vertices;
      ground = Constants.ground;
      vertices = [];
      vertices.push({
        x: this.screen.left,
        y: this.screen.top
      });
      vertices.push({
        x: this.screen.left,
        y: this.screen.bottom
      });
      vertices.push({
        x: this.player.left,
        y: this.screen.bottom
      });
      vertices.push({
        x: this.player.left,
        y: this.screen.top
      });
      this.level.physics.create_polygon(vertices, 'ground', ground.density, ground.restitution, ground.friction);
      vertices = [];
      vertices.push({
        x: this.player.right,
        y: this.screen.top
      });
      vertices.push({
        x: this.player.right,
        y: this.screen.bottom
      });
      vertices.push({
        x: this.screen.right,
        y: this.screen.bottom
      });
      vertices.push({
        x: this.screen.right,
        y: this.screen.top
      });
      this.level.physics.create_polygon(vertices, 'ground', ground.density, ground.restitution, ground.friction);
      vertices = [];
      vertices.push({
        x: this.player.right,
        y: this.player.bottom
      });
      vertices.push({
        x: this.player.left,
        y: this.player.bottom
      });
      vertices.push({
        x: this.player.left,
        y: this.screen.bottom
      });
      vertices.push({
        x: this.player.right,
        y: this.screen.bottom
      });
      this.level.physics.create_polygon(vertices, 'ground', ground.density, ground.restitution, ground.friction);
      vertices = [];
      vertices.push({
        x: this.player.right,
        y: this.screen.top
      });
      vertices.push({
        x: this.player.left,
        y: this.screen.top
      });
      vertices.push({
        x: this.player.left,
        y: this.player.top
      });
      vertices.push({
        x: this.player.right,
        y: this.player.top
      });
      return this.level.physics.create_polygon(vertices, 'ground', ground.density, ground.restitution, ground.friction);
    };

    Limits.prototype.init_sprites = function() {
      var bottom_size_x, bottom_size_y, left_size_x, left_size_y, right_size_x, right_size_y, texture, top_size_x, top_size_y;
      texture = PIXI.Texture.from(this.assets.get_url(this.texture_name));
      left_size_x = this.player.left - this.screen.left;
      left_size_y = this.screen.top - this.screen.bottom;
      right_size_x = this.screen.right - this.player.right;
      right_size_y = this.screen.top - this.screen.bottom;
      bottom_size_x = this.player.right - this.player.left;
      bottom_size_y = this.player.bottom - this.screen.bottom;
      top_size_x = this.player.right - this.player.left;
      top_size_y = this.screen.top - this.player.top;
      this.left_sprite = new PIXI.TilingSprite(texture, left_size_x, left_size_y);
      this.right_sprite = new PIXI.TilingSprite(texture, right_size_x, right_size_y);
      this.bottom_sprite = new PIXI.TilingSprite(texture, bottom_size_x, bottom_size_y);
      this.top_sprite = new PIXI.TilingSprite(texture, top_size_x, top_size_y);
      this.left_sprite.x = this.screen.left;
      this.left_sprite.y = -this.screen.top;
      this.left_sprite.anchor.x = 0;
      this.left_sprite.anchor.y = 0;
      this.left_sprite.tileScale.x = 1.0 / 40;
      this.left_sprite.tileScale.y = 1.0 / 40;
      this.right_sprite.x = this.player.right;
      this.right_sprite.y = -this.screen.top;
      this.right_sprite.anchor.x = 0;
      this.right_sprite.anchor.y = 0;
      this.right_sprite.tileScale.x = 1.0 / 40;
      this.right_sprite.tileScale.y = 1.0 / 40;
      this.bottom_sprite.x = this.player.left;
      this.bottom_sprite.y = -this.player.bottom;
      this.bottom_sprite.anchor.x = 0;
      this.bottom_sprite.anchor.y = 0;
      this.bottom_sprite.tileScale.x = 1.0 / 40;
      this.bottom_sprite.tileScale.y = 1.0 / 40;
      this.top_sprite.x = this.player.left;
      this.top_sprite.y = -this.screen.top;
      this.top_sprite.anchor.x = 0;
      this.top_sprite.anchor.y = 0;
      this.top_sprite.tileScale.x = 1.0 / 40;
      this.top_sprite.tileScale.y = 1.0 / 40;
      this.level.camera.neutral_z_container.addChild(this.left_sprite);
      this.level.camera.neutral_z_container.addChild(this.right_sprite);
      this.level.camera.neutral_z_container.addChild(this.bottom_sprite);
      return this.level.camera.neutral_z_container.addChild(this.top_sprite);
    };

    Limits.prototype.update = function() {
      this.left_sprite.visible = this.visible(this.left_wall_aabb);
      this.right_sprite.visible = this.visible(this.right_wall_aabb);
      this.top_sprite.visible = this.visible(this.top_wall_aabb);
      return this.bottom_sprite.visible = this.visible(this.bottom_wall_aabb);
    };

    Limits.prototype.visible = function(wall_aabb) {
      return wall_aabb.TestOverlap(this.level.camera.aabb);
    };

    return Limits;

  })();

  Sky = (function() {
    function Sky(level) {
      this.level = level;
      this.assets = level.assets;
      this.theme = this.assets.theme;
      this.options = level.options;
    }

    Sky.prototype.parse = function(level_json) {
      this.name = "sky";
      // this.name = level_json.info.sky.toLowerCase();
      // if (this.name === '') {
      //   console.log('Sky not set in level info.');
      // }
      this.filename = this.theme.texture_params(this.name).file;
      return this;
    };

    Sky.prototype.load_assets = function() {
      return this.assets.textures.push(this.filename);
    };

    Sky.prototype.init = function() {
      return this.init_sprites();
    };

    Sky.prototype.init_sprites = function() {
      var texture;
      texture = PIXI.Texture.from(this.assets.get_url(this.filename));
      this.sprite = new PIXI.TilingSprite(texture, this.options.width, this.options.height);
      this.sprite.position.x = 0;
      this.sprite.position.y = 0;
      return this.level.stage.addChildAt(this.sprite, 0);
    };

    Sky.prototype.update = function() {
      var position_factor_x, position_factor_y;
      this.sprite.tileScale.x = 4;
      this.sprite.tileScale.y = 4;
      position_factor_x = 15;
      position_factor_y = 7;
      this.sprite.tilePosition.x = -this.level.camera.target().x * position_factor_x;
      return this.sprite.tilePosition.y = this.level.camera.target().y * position_factor_y;
    };

    return Sky;

  })();

  b2Vec2 = Box2D.Common.Math.b2Vec2;

  b2BodyDef = Box2D.Dynamics.b2BodyDef;

  b2Body = Box2D.Dynamics.b2Body;

  b2FixtureDef = Box2D.Dynamics.b2FixtureDef;

  b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;

  b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;

  b2PrismaticJointDef = Box2D.Dynamics.Joints.b2PrismaticJointDef;

  b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef;

  Moto = (function() {
    function Moto(level) {
      this.level = level;
      this.assets = level.assets;
      this.world = level.physics.world;
      this.mirror = 1;
      this.dead = false;
      this.rider = new Rider(level, this);
    }

    Moto.prototype.destroy = function() {
      this.rider.destroy();
      this.world.DestroyBody(this.body);
      this.world.DestroyBody(this.left_wheel);
      this.world.DestroyBody(this.right_wheel);
      this.world.DestroyBody(this.left_axle);
      this.world.DestroyBody(this.right_axle);
      this.level.camera.neutral_z_container.removeChild(this.body_sprite);
      this.level.camera.neutral_z_container.removeChild(this.left_wheel_sprite);
      this.level.camera.neutral_z_container.removeChild(this.right_wheel_sprite);
      this.level.camera.neutral_z_container.removeChild(this.left_axle_sprite);
      return this.level.camera.neutral_z_container.removeChild(this.right_axle_sprite);
    };

    Moto.prototype.load_assets = function() {
      var j, len, part, parts;
      parts = [Constants.body, Constants.left_wheel, Constants.right_wheel, Constants.left_axle, Constants.right_axle];
      for (j = 0, len = parts.length; j < len; j++) {
        part = parts[j];
        this.assets.moto.push(part.texture);
      }
      return this.rider.load_assets();
    };

    Moto.prototype.init = function() {
      this.init_physics_parts();
      return this.init_sprites();
    };

    Moto.prototype.init_physics_parts = function() {
      this.player_start = this.level.entities.player_start;
      this.body = this.create_body();
      this.left_wheel = this.create_wheel(Constants.left_wheel);
      this.right_wheel = this.create_wheel(Constants.right_wheel);
      this.left_axle = this.create_axle(Constants.left_axle);
      this.right_axle = this.create_axle(Constants.right_axle);
      this.left_revolute_joint = this.create_revolute_joint(this.left_axle, this.left_wheel);
      this.right_revolute_joint = this.create_revolute_joint(this.right_axle, this.right_wheel);
      this.left_prismatic_joint = this.create_prismatic_joint(this.left_axle, Constants.left_suspension);
      this.right_prismatic_joint = this.create_prismatic_joint(this.right_axle, Constants.right_suspension);
      return this.rider.init_physics_parts();
    };

    Moto.prototype.init_sprites = function() {
      var asset_name, j, len, part, ref;
      ref = ['body', 'left_wheel', 'right_wheel', 'left_axle', 'right_axle'];
      for (j = 0, len = ref.length; j < len; j++) {
        part = ref[j];
        asset_name = Constants[part].texture;
        this[part + "_sprite"] = new PIXI.Sprite.from(this.assets.get_url(asset_name));
        this.level.camera.neutral_z_container.addChild(this[part + "_sprite"]);
      }
      return this.rider.init_sprites();
    };

    Moto.prototype.move = function(input) {
      var air_density, back_force, biker_force, drag_force, moto_acceleration, object_penetration, rigidity, squared_speed, v;
      if (input == null) {
        input = this.level.input;
      }
      moto_acceleration = Constants.moto_acceleration;
      biker_force = Constants.biker_force;
      if (!this.dead) {
        if (input.up) {
          this.left_wheel.ApplyTorque(-this.mirror * moto_acceleration);
        }
        if (input.down) {
          this.right_wheel.SetAngularVelocity(0);
          this.left_wheel.SetAngularVelocity(0);
        }
        if ((input.left && this.mirror === 1) || (input.right && this.mirror === -1)) {
          this.wheeling(biker_force);
        }
        if ((input.right && this.mirror === 1) || (input.left && this.mirror === -1)) {
          biker_force = -biker_force * 0.8;
          this.wheeling(biker_force);
        }
        if (input.space) {
          this.flip();
        }
      }
      if (!input.up && !input.down) {
        v = this.left_wheel.GetAngularVelocity();
        this.left_wheel.ApplyTorque((Math.abs(v) >= 0.2 ? -v / 10 : void 0));
        v = this.right_wheel.GetAngularVelocity();
        this.right_wheel.ApplyTorque((Math.abs(v) >= 0.2 ? -v / 100 : void 0));
      }
      back_force = Constants.left_suspension.back_force;
      rigidity = Constants.left_suspension.rigidity;
      this.left_prismatic_joint.SetMaxMotorForce(rigidity + Math.abs(rigidity * 100 * Math.pow(this.left_prismatic_joint.GetJointTranslation(), 2)));
      this.left_prismatic_joint.SetMotorSpeed(-back_force * this.left_prismatic_joint.GetJointTranslation());
      back_force = Constants.right_suspension.back_force;
      rigidity = Constants.right_suspension.rigidity;
      this.right_prismatic_joint.SetMaxMotorForce(rigidity + Math.abs(rigidity * 100 * Math.pow(this.right_prismatic_joint.GetJointTranslation(), 2)));
      this.right_prismatic_joint.SetMotorSpeed(-back_force * this.right_prismatic_joint.GetJointTranslation());
      air_density = Constants.air_density;
      object_penetration = 0.025;
      squared_speed = Math.pow(this.body.GetLinearVelocity().x, 2);
      drag_force = air_density * squared_speed * object_penetration;
      this.body.SetLinearDamping(drag_force);
      if (this.right_wheel.GetAngularVelocity() > Constants.max_moto_speed) {
        this.right_wheel.SetAngularVelocity(Constants.max_moto_speed);
      } else if (this.right_wheel.GetAngularVelocity() < -Constants.max_moto_speed) {
        this.right_wheel.SetAngularVelocity(-Constants.max_moto_speed);
      }
      if (this.left_wheel.GetAngularVelocity() > Constants.max_moto_speed) {
        return this.left_wheel.SetAngularVelocity(Constants.max_moto_speed);
      } else if (this.left_wheel.GetAngularVelocity() < -Constants.max_moto_speed) {
        return this.left_wheel.SetAngularVelocity(-Constants.max_moto_speed);
      }
    };

    Moto.prototype.wheeling = function(force) {
      var force_leg, force_torso, moto_angle;
      moto_angle = this.mirror * this.body.GetAngle();
      this.body.ApplyTorque(this.mirror * force * 0.50);
      force_torso = Math2D.rotate_point({
        x: this.mirror * (-force),
        y: 0
      }, moto_angle, {
        x: 0,
        y: 0
      });
      force_torso.y = this.mirror * force_torso.y;
      this.rider.torso.ApplyForce(force_torso, this.rider.torso.GetWorldCenter());
      force_leg = Math2D.rotate_point({
        x: this.mirror * force,
        y: 0
      }, moto_angle, {
        x: 0,
        y: 0
      });
      force_leg.y = this.mirror * force_leg.y;
      return this.rider.lower_leg.ApplyForce(force_leg, this.rider.lower_leg.GetWorldCenter());
    };

    Moto.prototype.flip = function() {
      if (!this.dead) {
        return MotoFlipService.execute(this);
      }
    };

    Moto.prototype.create_body = function() {
      var body, bodyDef, fixDef;
      fixDef = new b2FixtureDef();
      fixDef.shape = new b2PolygonShape();
      fixDef.density = Constants.body.density;
      fixDef.restitution = Constants.body.restitution;
      fixDef.friction = Constants.body.friction;
      fixDef.isSensor = !Constants.body.collisions;
      fixDef.filter.groupIndex = -1;
      Physics.create_shape(fixDef, Constants.body.shape, this.mirror === -1);
      bodyDef = new b2BodyDef();
      bodyDef.position.x = this.player_start.x + this.mirror * Constants.body.position.x;
      bodyDef.position.y = this.player_start.y + Constants.body.position.y;
      bodyDef.userData = {
        name: 'moto',
        type: 'player',
        moto: this
      };
      bodyDef.type = b2Body.b2_dynamicBody;
      body = this.world.CreateBody(bodyDef);
      body.CreateFixture(fixDef);
      return body;
    };

    Moto.prototype.create_wheel = function(part_constants) {
      var bodyDef, fixDef, wheel;
      fixDef = new b2FixtureDef();
      fixDef.shape = new b2CircleShape(part_constants.radius);
      fixDef.density = part_constants.density;
      fixDef.restitution = part_constants.restitution;
      fixDef.friction = part_constants.friction;
      fixDef.isSensor = !part_constants.collisions;
      fixDef.filter.groupIndex = -1;
      bodyDef = new b2BodyDef();
      bodyDef.position.x = this.player_start.x + this.mirror * part_constants.position.x;
      bodyDef.position.y = this.player_start.y + part_constants.position.y;
      bodyDef.userData = {
        name: 'moto',
        type: 'player',
        moto: this
      };
      bodyDef.type = b2Body.b2_dynamicBody;
      wheel = this.world.CreateBody(bodyDef);
      wheel.CreateFixture(fixDef);
      return wheel;
    };

    Moto.prototype.create_axle = function(part_constants) {
      var body, bodyDef, fixDef;
      fixDef = new b2FixtureDef();
      fixDef.shape = new b2PolygonShape();
      fixDef.density = part_constants.density;
      fixDef.restitution = part_constants.restitution;
      fixDef.friction = part_constants.friction;
      fixDef.isSensor = !part_constants.collisions;
      fixDef.filter.groupIndex = -1;
      Physics.create_shape(fixDef, part_constants.shape, this.mirror === -1);
      bodyDef = new b2BodyDef();
      bodyDef.position.x = this.player_start.x + this.mirror * part_constants.position.x;
      bodyDef.position.y = this.player_start.y + part_constants.position.y;
      bodyDef.userData = {
        name: 'moto',
        type: 'player',
        moto: this
      };
      bodyDef.type = b2Body.b2_dynamicBody;
      body = this.world.CreateBody(bodyDef);
      body.CreateFixture(fixDef);
      return body;
    };

    Moto.prototype.create_revolute_joint = function(axle, wheel) {
      var jointDef;
      jointDef = new b2RevoluteJointDef();
      jointDef.Initialize(axle, wheel, wheel.GetWorldCenter());
      return this.world.CreateJoint(jointDef);
    };

    Moto.prototype.create_prismatic_joint = function(axle, part_constants) {
      var angle, jointDef;
      jointDef = new b2PrismaticJointDef();
      angle = part_constants.angle;
      jointDef.Initialize(this.body, axle, axle.GetWorldCenter(), new b2Vec2(this.mirror * angle.x, angle.y));
      jointDef.enableLimit = true;
      jointDef.lowerTranslation = part_constants.lower_translation;
      jointDef.upperTranslation = part_constants.upper_translation;
      jointDef.enableMotor = true;
      jointDef.collideConnected = false;
      return this.world.CreateJoint(jointDef);
    };

    Moto.prototype.update = function() {
      var visible;
      this.aabb = this.compute_aabb();
      visible = this.visible();
      this.update_wheel(this.left_wheel, Constants.left_wheel, visible);
      this.update_wheel(this.right_wheel, Constants.right_wheel, visible);
      this.update_left_axle(this.left_axle, Constants.left_axle, visible);
      this.update_right_axle(this.right_axle, Constants.right_axle, visible);
      this.update_body(this.body, Constants.body, visible);
      return this.rider.update(visible);
    };

    Moto.prototype.update_wheel = function(part, part_constants, visible) {
      var angle, position, wheel_sprite;
      if (part_constants.position.x < 0) {
        wheel_sprite = this.left_wheel_sprite;
      } else {
        wheel_sprite = this.right_wheel_sprite;
      }
      wheel_sprite.visible = visible;
      if (visible) {
        position = part.GetPosition();
        angle = part.GetAngle();
        wheel_sprite.width = 2 * part_constants.radius;
        wheel_sprite.height = 2 * part_constants.radius;
        wheel_sprite.anchor.x = 0.5;
        wheel_sprite.anchor.y = 0.5;
        wheel_sprite.x = position.x;
        wheel_sprite.y = -position.y;
        wheel_sprite.rotation = -angle;
        return wheel_sprite.scale.x = this.mirror * Math.abs(wheel_sprite.scale.x);
      }
    };

    Moto.prototype.update_body = function(part, part_constants, visible) {
      var angle, position;
      this.body_sprite.visible = visible;
      if (visible) {
        position = part.GetPosition();
        angle = part.GetAngle();
        this.body_sprite.width = part_constants.texture_size.x;
        this.body_sprite.height = part_constants.texture_size.y;
        this.body_sprite.anchor.x = 0.5;
        this.body_sprite.anchor.y = 0.5;
        this.body_sprite.x = position.x;
        this.body_sprite.y = -position.y;
        this.body_sprite.rotation = -angle;
        return this.body_sprite.scale.x = this.mirror * Math.abs(this.body_sprite.scale.x);
      }
    };

    Moto.prototype.update_left_axle = function(part, part_constants, visible) {
      var axle_position, axle_thickness, texture, wheel_position;
      axle_thickness = 0.09;
      wheel_position = this.left_wheel.GetPosition();
      wheel_position = {
        x: wheel_position.x - this.mirror * axle_thickness / 2.0,
        y: wheel_position.y - 0.025
      };
      axle_position = {
        x: -0.17 * this.mirror,
        y: -0.30
      };
      texture = part_constants.texture;
      return this.update_axle_common(wheel_position, axle_position, axle_thickness, texture, 'left', visible);
    };

    Moto.prototype.update_right_axle = function(part, part_constants, visible) {
      var axle_position, axle_thickness, texture, wheel_position;
      axle_thickness = 0.07;
      wheel_position = this.right_wheel.GetPosition();
      wheel_position = {
        x: wheel_position.x + this.mirror * axle_thickness / 2.0 - this.mirror * 0.03,
        y: wheel_position.y - 0.045
      };
      axle_position = {
        x: 0.52 * this.mirror,
        y: 0.025
      };
      texture = part_constants.texture;
      return this.update_axle_common(wheel_position, axle_position, axle_thickness, texture, 'right', visible);
    };

    Moto.prototype.update_axle_common = function(wheel_position, axle_position, axle_thickness, texture, side, visible) {
      var angle, axle_adjusted_position, axle_sprite, body_angle, body_position, distance;
      axle_sprite = this[side + "_axle_sprite"];
      axle_sprite.visible = visible;
      if (visible) {
        body_position = this.body.GetPosition();
        body_angle = this.body.GetAngle();
        axle_adjusted_position = Math2D.rotate_point(axle_position, body_angle, body_position);
        distance = Math2D.distance_between_points(wheel_position, axle_adjusted_position);
        angle = Math2D.angle_between_points(axle_adjusted_position, wheel_position) + this.mirror * Math.PI / 2;
        axle_sprite.width = distance;
        axle_sprite.height = axle_thickness;
        axle_sprite.anchor.x = 0.0;
        axle_sprite.anchor.y = 0.5;
        axle_sprite.x = wheel_position.x;
        axle_sprite.y = -wheel_position.y;
        axle_sprite.rotation = -angle;
        return axle_sprite.scale.x = this.mirror * Math.abs(axle_sprite.scale.x);
      }
    };

    Moto.prototype.compute_aabb = function() {
      var aabb, lower1, lower2, lower3, upper1, upper2, upper3;
      lower1 = this.left_wheel.GetFixtureList().GetAABB().lowerBound;
      lower2 = this.right_wheel.GetFixtureList().GetAABB().lowerBound;
      lower3 = this.rider.head.GetFixtureList().GetAABB().lowerBound;
      upper1 = this.left_wheel.GetFixtureList().GetAABB().upperBound;
      upper2 = this.right_wheel.GetFixtureList().GetAABB().upperBound;
      upper3 = this.rider.head.GetFixtureList().GetAABB().upperBound;
      aabb = new b2AABB();
      aabb.lowerBound.Set(Math.min(lower1.x, lower2.x, lower3.x), Math.min(lower1.y, lower2.y, lower3.y));
      aabb.upperBound.Set(Math.max(upper1.x, upper2.x, upper3.x), Math.max(upper1.y, upper2.y, upper3.y));
      return aabb;
    };

    Moto.prototype.visible = function() {
      return this.aabb.TestOverlap(this.level.camera.aabb);
    };

    return Moto;

  })();

  b2Vec2 = Box2D.Common.Math.b2Vec2;

  b2BodyDef = Box2D.Dynamics.b2BodyDef;

  b2Body = Box2D.Dynamics.b2Body;

  b2FixtureDef = Box2D.Dynamics.b2FixtureDef;

  b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;

  b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;

  b2PrismaticJointDef = Box2D.Dynamics.Joints.b2PrismaticJointDef;

  b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef;

  Rider = (function() {
    function Rider(level, moto) {
      this.level = level;
      this.assets = level.assets;
      this.world = level.physics.world;
      this.moto = moto;
      this.mirror = moto.mirror;
    }

    Rider.prototype.destroy = function() {
      this.world.DestroyBody(this.head);
      this.world.DestroyBody(this.torso);
      this.world.DestroyBody(this.lower_leg);
      this.world.DestroyBody(this.upper_leg);
      this.world.DestroyBody(this.lower_arm);
      this.world.DestroyBody(this.upper_arm);
      this.level.camera.neutral_z_container.removeChild(this.head_sprite);
      this.level.camera.neutral_z_container.removeChild(this.torso_sprite);
      this.level.camera.neutral_z_container.removeChild(this.lower_leg_sprite);
      this.level.camera.neutral_z_container.removeChild(this.upper_leg_sprite);
      this.level.camera.neutral_z_container.removeChild(this.lower_arm_sprite);
      return this.level.camera.neutral_z_container.removeChild(this.upper_arm_sprite);
    };

    Rider.prototype.load_assets = function() {
      var j, len, part, parts, results;
      parts = [Constants.torso, Constants.upper_leg, Constants.lower_leg, Constants.upper_arm, Constants.lower_arm];
      results = [];
      for (j = 0, len = parts.length; j < len; j++) {
        part = parts[j];
        results.push(this.assets.moto.push(part.texture));
      }
      return results;
    };

    Rider.prototype.init_physics_parts = function() {
      this.player_start = this.level.entities.player_start;
      this.head = this.create_head();
      this.torso = this.create_part(Constants.torso, 'torso');
      this.lower_leg = this.create_part(Constants.lower_leg, 'lower_leg');
      this.upper_leg = this.create_part(Constants.upper_leg, 'upper_leg');
      this.lower_arm = this.create_part(Constants.lower_arm, 'lower_arm');
      this.upper_arm = this.create_part(Constants.upper_arm, 'upper_arm');
      this.neck_joint = this.create_neck_joint();
      this.ankle_joint = this.create_joint(Constants.ankle, this.lower_leg, this.moto.body);
      this.wrist_joint = this.create_joint(Constants.wrist, this.lower_arm, this.moto.body);
      this.knee_joint = this.create_joint(Constants.knee, this.lower_leg, this.upper_leg);
      this.elbow_joint = this.create_joint(Constants.elbow, this.upper_arm, this.lower_arm);
      this.shoulder_joint = this.create_joint(Constants.shoulder, this.upper_arm, this.torso, true);
      return this.hip_joint = this.create_joint(Constants.hip, this.upper_leg, this.torso, true);
    };

    Rider.prototype.init_sprites = function() {
      var asset_name, j, len, part, ref, results;
      ref = ['torso', 'upper_leg', 'lower_leg', 'upper_arm', 'lower_arm'];
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        part = ref[j];
        asset_name = Constants[part].texture;
        this[part + "_sprite"] = new PIXI.Sprite.from(this.assets.get_url(asset_name));
        results.push(this.level.camera.neutral_z_container.addChild(this[part + "_sprite"]));
      }
      return results;
    };

    Rider.prototype.position = function() {
      return this.moto.body.GetPosition();
    };

    Rider.prototype.eject = function() {
      var adjusted_force_vector, eject_angle, force_vector;
      if (!this.moto.dead) {
        this.level.listeners.kill_moto(this.moto);
        force_vector = {
          x: 150.0 * this.moto.mirror,
          y: 0
        };
        eject_angle = this.mirror * this.moto.body.GetAngle() + Math.PI / 4.0;
        adjusted_force_vector = Math2D.rotate_point(force_vector, eject_angle, {
          x: 0,
          y: 0
        });
        return this.torso.ApplyForce(adjusted_force_vector, this.torso.GetWorldCenter());
      }
    };

    Rider.prototype.create_head = function() {
      var body, bodyDef, fixDef;
      fixDef = new b2FixtureDef();
      fixDef.shape = new b2CircleShape(Constants.head.radius);
      fixDef.density = Constants.head.density;
      fixDef.restitution = Constants.head.restitution;
      fixDef.friction = Constants.head.friction;
      fixDef.isSensor = !Constants.head.collisions;
      fixDef.filter.groupIndex = -1;
      bodyDef = new b2BodyDef();
      bodyDef.position.x = this.player_start.x + this.mirror * Constants.head.position.x;
      bodyDef.position.y = this.player_start.y + Constants.head.position.y;
      bodyDef.userData = {
        name: 'rider',
        type: 'player',
        part: 'head',
        rider: this
      };
      bodyDef.type = b2Body.b2_dynamicBody;
      body = this.world.CreateBody(bodyDef);
      body.CreateFixture(fixDef);
      return body;
    };

    Rider.prototype.create_part = function(part_constants, name) {
      var body, bodyDef, fixDef;
      fixDef = new b2FixtureDef();
      fixDef.shape = new b2PolygonShape();
      fixDef.density = part_constants.density;
      fixDef.restitution = part_constants.restitution;
      fixDef.friction = part_constants.friction;
      fixDef.isSensor = !part_constants.collisions;
      fixDef.filter.groupIndex = -1;
      Physics.create_shape(fixDef, part_constants.shape, this.mirror === -1);
      bodyDef = new b2BodyDef();
      bodyDef.position.x = this.player_start.x + this.mirror * part_constants.position.x;
      bodyDef.position.y = this.player_start.y + part_constants.position.y;
      bodyDef.angle = this.mirror * part_constants.angle;
      bodyDef.userData = {
        name: 'rider',
        type: 'player',
        part: name,
        rider: this
      };
      bodyDef.type = b2Body.b2_dynamicBody;
      body = this.world.CreateBody(bodyDef);
      body.CreateFixture(fixDef);
      return body;
    };

    Rider.prototype.set_joint_commons = function(joint) {
      if (this.mirror === 1) {
        joint.lowerAngle = -Math.PI / 15;
        joint.upperAngle = Math.PI / 108;
      } else if (this.mirror === -1) {
        joint.lowerAngle = -Math.PI / 108;
        joint.upperAngle = Math.PI / 15;
      }
      return joint.enableLimit = true;
    };

    Rider.prototype.create_neck_joint = function() {
      var axe, jointDef, position;
      position = this.head.GetWorldCenter();
      axe = {
        x: position.x,
        y: position.y
      };
      jointDef = new b2RevoluteJointDef();
      jointDef.Initialize(this.head, this.torso, axe);
      return this.world.CreateJoint(jointDef);
    };

    Rider.prototype.create_joint = function(joint_constants, part1, part2, invert_joint) {
      var axe, jointDef, position;
      if (invert_joint == null) {
        invert_joint = false;
      }
      position = part1.GetWorldCenter();
      axe = {
        x: position.x + this.mirror * joint_constants.axe_position.x,
        y: position.y + joint_constants.axe_position.y
      };
      jointDef = new b2RevoluteJointDef();
      if (invert_joint) {
        jointDef.Initialize(part2, part1, axe);
      } else {
        jointDef.Initialize(part1, part2, axe);
      }
      this.set_joint_commons(jointDef);
      return this.world.CreateJoint(jointDef);
    };

    Rider.prototype.update = function(visible) {
      this.update_part(this.torso, 'torso', visible);
      this.update_part(this.upper_leg, 'upper_leg', visible);
      this.update_part(this.lower_leg, 'lower_leg', visible);
      this.update_part(this.upper_arm, 'upper_arm', visible);
      return this.update_part(this.lower_arm, 'lower_arm', visible);
    };

    Rider.prototype.update_part = function(part, name, visible) {
      var angle, part_constants, position, sprite, texture;
      sprite = this[name + "_sprite"];
      sprite.visible = visible;
      if (visible) {
        part_constants = Constants[name];
        position = part.GetPosition();
        angle = part.GetAngle();
        texture = part_constants.texture;
        sprite.width = part_constants.texture_size.x;
        sprite.height = part_constants.texture_size.y;
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        sprite.x = position.x;
        sprite.y = -position.y;
        sprite.rotation = -angle;
        return sprite.scale.x = this.mirror * Math.abs(sprite.scale.x);
      }
    };

    return Rider;

  })();

  MotoFlipService = (function() {
    function MotoFlipService() {}

    MotoFlipService.execute = function(moto) {
      var body, head, left_axle, left_wheel, lower_arm, lower_leg, right_axle, right_wheel, torso, upper_arm, upper_leg;
      body = {
        position: moto.body.GetPosition(),
        angle: moto.body.GetAngle(),
        linear: moto.body.GetLinearVelocity(),
        angular: moto.body.GetAngularVelocity()
      };
      left_wheel = {
        position: moto.left_wheel.GetPosition(),
        angle: moto.left_wheel.GetAngle(),
        linear: moto.left_wheel.GetLinearVelocity(),
        angular: moto.left_wheel.GetAngularVelocity()
      };
      right_wheel = {
        position: moto.right_wheel.GetPosition(),
        angle: moto.right_wheel.GetAngle(),
        linear: moto.right_wheel.GetLinearVelocity(),
        angular: moto.right_wheel.GetAngularVelocity()
      };
      left_axle = {
        position: moto.left_axle.GetPosition(),
        angle: moto.left_axle.GetAngle(),
        linear: moto.left_axle.GetLinearVelocity(),
        angular: moto.left_axle.GetAngularVelocity()
      };
      right_axle = {
        position: moto.right_axle.GetPosition(),
        angle: moto.right_axle.GetAngle(),
        linear: moto.right_axle.GetLinearVelocity(),
        angular: moto.right_axle.GetAngularVelocity()
      };
      head = {
        position: moto.rider.head.GetPosition(),
        angle: moto.rider.head.GetAngle(),
        linear: moto.rider.head.GetLinearVelocity(),
        angular: moto.rider.head.GetAngularVelocity()
      };
      torso = {
        position: moto.rider.torso.GetPosition(),
        angle: moto.rider.torso.GetAngle(),
        linear: moto.rider.torso.GetLinearVelocity(),
        angular: moto.rider.torso.GetAngularVelocity()
      };
      lower_leg = {
        position: moto.rider.lower_leg.GetPosition(),
        angle: moto.rider.lower_leg.GetAngle(),
        linear: moto.rider.lower_leg.GetLinearVelocity(),
        angular: moto.rider.lower_leg.GetAngularVelocity()
      };
      upper_leg = {
        position: moto.rider.upper_leg.GetPosition(),
        angle: moto.rider.upper_leg.GetAngle(),
        linear: moto.rider.upper_leg.GetLinearVelocity(),
        angular: moto.rider.upper_leg.GetAngularVelocity()
      };
      lower_arm = {
        position: moto.rider.lower_arm.GetPosition(),
        angle: moto.rider.lower_arm.GetAngle(),
        linear: moto.rider.lower_arm.GetLinearVelocity(),
        angular: moto.rider.lower_arm.GetAngularVelocity()
      };
      upper_arm = {
        position: moto.rider.upper_arm.GetPosition(),
        angle: moto.rider.upper_arm.GetAngle(),
        linear: moto.rider.upper_arm.GetLinearVelocity(),
        angular: moto.rider.upper_arm.GetAngularVelocity()
      };
      moto.mirror = moto.rider.mirror = -moto.mirror;
      moto.destroy();
      moto.init();
      moto.body.SetPosition(body.position);
      moto.body.SetAngle(body.angle);
      moto.body.SetLinearVelocity(body.linear);
      moto.body.SetAngularVelocity(body.angular);
      moto.left_wheel.SetPosition(right_wheel.position);
      moto.left_wheel.SetAngle(-left_wheel.angle);
      moto.left_wheel.SetLinearVelocity(right_wheel.linear);
      moto.left_wheel.SetAngularVelocity(-left_wheel.angular);
      moto.right_wheel.SetPosition(left_wheel.position);
      moto.right_wheel.SetAngle(-right_wheel.angle);
      moto.right_wheel.SetLinearVelocity(left_wheel.linear);
      moto.right_wheel.SetAngularVelocity(-right_wheel.angular);
      moto.left_axle.SetPosition(left_axle.position);
      moto.left_axle.SetAngle(left_axle.angle);
      moto.left_axle.SetLinearVelocity(left_axle.linear);
      moto.left_axle.SetAngularVelocity(left_axle.angular);
      moto.right_axle.SetPosition(right_axle.position);
      moto.right_axle.SetAngle(right_axle.angle);
      moto.right_axle.SetLinearVelocity(right_axle.linear);
      moto.right_axle.SetAngularVelocity(right_axle.angular);
      moto.rider.head.SetPosition(head.position);
      moto.rider.head.SetAngle(head.angle);
      moto.rider.head.SetLinearVelocity(head.linear);
      moto.rider.head.SetAngularVelocity(head.angular);
      moto.rider.torso.SetPosition(torso.position);
      moto.rider.torso.SetAngle(torso.angle);
      moto.rider.torso.SetLinearVelocity(torso.linear);
      moto.rider.torso.SetAngularVelocity(torso.angular);
      moto.rider.lower_leg.SetPosition(lower_leg.position);
      moto.rider.lower_leg.SetAngle(lower_leg.angle);
      moto.rider.lower_leg.SetLinearVelocity(lower_leg.linear);
      moto.rider.lower_leg.SetAngularVelocity(lower_leg.angular);
      moto.rider.upper_leg.SetPosition(upper_leg.position);
      moto.rider.upper_leg.SetAngle(upper_leg.angle);
      moto.rider.upper_leg.SetLinearVelocity(upper_leg.linear);
      moto.rider.upper_leg.SetAngularVelocity(upper_leg.angular);
      moto.rider.lower_arm.SetPosition(lower_arm.position);
      moto.rider.lower_arm.SetAngle(lower_arm.angle);
      moto.rider.lower_arm.SetLinearVelocity(lower_arm.linear);
      moto.rider.lower_arm.SetAngularVelocity(lower_arm.angular);
      moto.rider.upper_arm.SetPosition(upper_arm.position);
      moto.rider.upper_arm.SetAngle(upper_arm.angle);
      moto.rider.upper_arm.SetLinearVelocity(upper_arm.linear);
      return moto.rider.upper_arm.SetAngularVelocity(upper_arm.angular);
    };

    return MotoFlipService;

  })();

  Assets = (function() {
    function Assets() {
      this.theme = {};
      this.textures = [];
      this.anims = [];
      this.effects = [];
      this.moto = [];
      this.sounds = [];
      this.resources = {};
    }

    Assets.prototype.parse_theme = function(theme_json) {
      return this.theme = $.extend(this.theme, new Theme(theme_json));
    };

    Assets.prototype.load = function(callback) {
      var item, items, j, k, l, len, len1, len2, len3, len4, m, n, ref, ref1, ref2, ref3, ref4;
      PIXI.Loader.shared.reset();
      items = [];
      ref = this.textures;
      for (j = 0, len = ref.length; j < len; j++) {
        item = ref[j];
        items.push({
          id: item,
          src: "data/Textures/Textures/" + (item.toLowerCase())
        });
      }
      ref1 = this.anims;
      for (k = 0, len1 = ref1.length; k < len1; k++) {
        item = ref1[k];
        items.push({
          id: item,
          src: "data/Textures/Anims/" + (item.toLowerCase())
        });
      }
      ref2 = this.effects;
      for (l = 0, len2 = ref2.length; l < len2; l++) {
        item = ref2[l];
        items.push({
          id: item,
          src: "data/Textures/Effects/" + (item.toLowerCase())
        });
      }
      ref3 = this.moto;
      for (m = 0, len3 = ref3.length; m < len3; m++) {
        item = ref3[m];
        items.push({
          id: item,
          src: "data/Textures/Riders/" + (item.toLowerCase()) + ".png"
        });
      }
      ref4 = this.remove_duplicate_textures(items);
      for (n = 0, len4 = ref4.length; n < len4; n++) {
        item = ref4[n];
        PIXI.Loader.shared.add(item.id, item.src);
      }
      return PIXI.Loader.shared.load((function(_this) {
        return function(loader, resources) {
          _this.resources = resources;
          return callback();
        };
      })(this));
    };

    Assets.prototype.get = function(name) {
      return this.resources[name].data;
    };

    Assets.prototype.get_url = function(name) {
      return this.resources[name].url;
    };

    Assets.prototype.remove_duplicate_textures = function(array) {
      var found, image, j, k, len, len1, unique, unique_image;
      unique = [];
      for (j = 0, len = array.length; j < len; j++) {
        image = array[j];
        found = false;
        for (k = 0, len1 = unique.length; k < len1; k++) {
          unique_image = unique[k];
          if (image.id === unique_image.id) {
            found = true;
          }
        }
        if (!found) {
          unique.push(image);
        }
      }
      return unique;
    };

    return Assets;

  })();

  Math2D = (function() {
    function Math2D() {}

    Math2D.distance_between_points = function(point1, point2) {
      var a, b;
      a = Math.pow(point1.x - point2.x, 2);
      b = Math.pow(point1.y - point2.y, 2);
      return Math.sqrt(a + b);
    };

    Math2D.angle_between_points = function(point1, point2) {
      if (point1.y - point2.y === 0) {
        if (point1.y > point2.y) {
          return Math.PI / 2;
        } else {
          return -Math.PI / 2;
        }
      } else {
        if (point1.y > point2.y) {
          return -Math.atan((point1.x - point2.x) / (point1.y - point2.y));
        } else {
          return -Math.atan((point2.x - point1.x) / (point2.y - point1.y)) + Math.PI;
        }
      }
    };

    Math2D.rotate_point = function(point, angle, rotation_axe) {
      var new_point;
      return new_point = {
        x: rotation_axe.x + point.x * Math.cos(angle) - point.y * Math.sin(angle),
        y: rotation_axe.y + point.x * Math.sin(angle) + point.y * Math.cos(angle)
      };
    };

    Math2D.not_collinear_vertices = function(vertices) {
      var i, j, len, size, vertex;
      size = vertices.length;
      for (i = j = 0, len = vertices.length; j < len; i = ++j) {
        vertex = vertices[i];
        if (vertex.x === vertices[(i + 1) % size].x && vertices[(i + 2) % size].x) {
          vertex.x = vertex.x + 0.001;
          vertices[(i + 1) % size].x = vertex.x - 0.001;
        }
        if (vertex.y === vertices[(i + 1) % size].y && vertices[(i + 2) % size].y) {
          vertex.y = vertex.y + 0.001;
          vertices[(i + 1) % size].y = vertex.y - 0.001;
        }
      }
      return false;
    };

    return Math2D;

  })();

  Theme = (function() {
    function Theme(theme_json) {
      this.sprites = [];
      this.edges = [];
      this.textures = [];
      this.load_theme(theme_json);
    }

    Theme.prototype.load_theme = function(theme_json) {
      var j, len, sprite;
      for (j = 0, len = theme_json.sprites.length; j < len; j++) {
        sprite = theme_json.sprites[j];
        if (sprite.type === 'Entity') {
          this.sprites[sprite.name] = {
            file: sprite.file,
            file_base: sprite.fileBase,
            file_ext: sprite.fileExtension,
            size: {
              width: parseFloat(sprite.width),
              height: parseFloat(sprite.height)
            },
            center: {
              x: parseFloat(sprite.centerX),
              y: parseFloat(sprite.centerY)
            },
            frames: sprite.frames.length,
            delay: parseFloat(sprite.delay)
          };
        } else if (sprite.type === 'EdgeEffect') {
          this.edges[sprite.name.toLowerCase()] = {
            file: sprite.file.toLowerCase(),
            scale: parseFloat(sprite.scale),
            depth: parseFloat(sprite.depth)
          };
        } else if (sprite.type === 'Texture') {
          this.textures[sprite.name.toLowerCase()] = {
            file: sprite.file ? sprite.file.toLowerCase() : '',
            file_base: sprite.fileBase,
            file_ext: sprite.fileExtension,
            delay: parseFloat(sprite.delay)
          };
        }
      }
    };

    Theme.prototype.sprite_params = function(name) {
      return this.sprites[name];
    };

    Theme.prototype.edge_params = function(name) {
      return this.edges[name];
    };

    Theme.prototype.texture_params = function(name) {
      return this.textures[name];
    };

    return Theme;

  })();

}).call(this);