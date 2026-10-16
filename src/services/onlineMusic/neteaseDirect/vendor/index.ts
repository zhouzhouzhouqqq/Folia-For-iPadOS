import operation0 from './album.js';
import operation1 from './album_detail_dynamic.js';
import operation2 from './album_sub.js';
import operation3 from './album_sublist.js';
import operation4 from './artist_album.js';
import operation5 from './artist_detail.js';
import operation6 from './artist_songs.js';
import operation7 from './artist_top_song.js';
import operation8 from './cloud_lyric_get.js';
import operation9 from './cloudsearch.js';
import operation10 from './fm_trash.js';
import operation11 from './history_recommend_songs.js';
import operation12 from './history_recommend_songs_detail.js';
import operation13 from './like.js';
import operation14 from './likelist.js';
import operation15 from './login_qr_key.js';
import operation16 from './login_status.js';
import operation17 from './logout.js';
import operation18 from './lyric_new.js';
import operation19 from './personal_fm_mode.js';
import operation20 from './personal_fm.js';
import operation21 from './personalized.js';
import operation22 from './playlist_detail.js';
import operation23 from './playlist_detail_dynamic.js';
import operation24 from './playlist_subscribe.js';
import operation25 from './playlist_track_all.js';
import operation26 from './playlist_tracks.js';
import operation27 from './recommend_songs.js';
import operation28 from './recommend_songs_dislike.js';
import operation29 from './song_chorus.js';
import operation30 from './song_copyright_rcmd.js';
import operation31 from './song_detail.js';
import operation32 from './user_account.js';
import operation33 from './user_cloud.js';
import operation34 from './user_cloud_detail.js';
import operation35 from './user_playlist.js';

// Statically bundled upstream route adapters.
export const upstreamRoutes: Record<string, (query: any, request: any) => Promise<any>> = {
    '/album': operation0,
    '/album/detail/dynamic': operation1,
    '/album/sub': operation2,
    '/album/sublist': operation3,
    '/artist/album': operation4,
    '/artist/detail': operation5,
    '/artist/songs': operation6,
    '/artist/top/song': operation7,
    '/cloud/lyric/get': operation8,
    '/cloudsearch': operation9,
    '/fm_trash': operation10,
    '/history/recommend/songs': operation11,
    '/history/recommend/songs/detail': operation12,
    '/like': operation13,
    '/likelist': operation14,
    '/login/qr/key': operation15,
    '/login/status': operation16,
    '/logout': operation17,
    '/lyric/new': operation18,
    '/personal/fm/mode': operation19,
    '/personal_fm': operation20,
    '/personalized': operation21,
    '/playlist/detail': operation22,
    '/playlist/detail/dynamic': operation23,
    '/playlist/subscribe': operation24,
    '/playlist/track/all': operation25,
    '/playlist/tracks': operation26,
    '/recommend/songs': operation27,
    '/recommend/songs/dislike': operation28,
    '/song/chorus': operation29,
    '/song/copyright/rcmd': operation30,
    '/song/detail': operation31,
    '/user/account': operation32,
    '/user/cloud': operation33,
    '/user/cloud/detail': operation34,
    '/user/playlist': operation35,
};
