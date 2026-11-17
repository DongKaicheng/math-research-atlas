# Moving interfaces separate energy topologies and produce a non-Radon dual functional

Status: PROVED-INTERNAL after author-separated internal audit; a higher-dimensional interface realization of an already frozen mechanism, not a new topology-separation principle. This is an explicit original-category example, not a counterexample to the unresolved C1 assertion for literal positive Radon data. It uses remaining degree q=1 in every space dimension n>=2; it does not identify q=1 with dimension one.

## 1. Exact frozen meanings

The recovered exact R12 source `12bde9976ef8d8dcb3abbfc23f71f8e1a1ae37a6195de0dcdd13f09c5c0f5f45.tex` defines

    D_S=C-C,
    ||h||_ed=inf{ r(a)+r(b): a,b in C, h=a-b},
    r(a)=e(a)^(1/2) for q=1.                            (T1)

This is ED3. The same source explicitly says it is not the discrepancy I or a Hilbert norm. ED6 only bounds I by the energy-difference norm, and explicitly does not identify their topologies. ED11 gives the separate source-functional estimate delta_*(mu_u,mu_v)<=I(u,v)^(1/2) when q=1. We use these exact scopes. Frozen R12 CG1–CG10 already proves strict separation and constructs a positive ED-bounded functional outside the strong dual on an annulus. Its exact recovered source has SHA256 30c2041787270a4a075953adc6440df5be1e67cc001210287478034a7b64e3de. The example below realizes the same mechanism with moving hypersurface masses for every n>=2 and smooth fixed background; it does not uncover a contradiction or a new general separation principle.

## 2. Actual potentials with moving spheres

Use the fixed original torus, Laurent box, field, norm, and parent max-reference w, quadratic on a protected ball. Here take S=beta^(n-1)[X], so q=1. Choose radii 0<a<b with Bbar_b inside that quadratic region. On its closure let m=min(-w)>0. Choose one t in (0,1/2) with t b^2/2<m/2. For each R in [a,b] define

    psi_R(x)=(R^2-|x|^2)/2 on B_R, and 0 outside,
    u_R=w+t psi_R(torus moment).

The interior Hessian is (1-t)I, the exterior is the original w, and the sphere Hessian jump is t R nu tensor nu dS. Thus u_R is actual continuous psh, negative, with the same ordinary zero boundary and the same finite-mass/bounded-energy/no-loss qualifications as the parent. This argument is independent of the q>=2 polynomial construction.

For q=1, distributional differentiation directly gives

    mu_(u_R)-mu_w
       =t (n-1)! sigma_*[-n 1_(B_R) dx+R dS_R].          (T2)

Full original tests are retained: mollify the convex local profile, apply the smooth calibration, and pass D of the order-zero coefficient current to the uniform limit. The sphere term can also be read directly from the jump of the first derivatives. Write omega=area(S^(n-1)) for the unit sphere.

For r,s in [a,b], the potential difference is compactly supported in B_b. Its gradient is zero inside B_min(r,s), equals plus or minus t x in the intervening annulus, and is zero outside B_max(r,s). The actual Green identity, or direct real integration by parts with (T2), therefore gives

    I(u_r,u_s)
       =t^2 (n-1)! omega/(n+2) |r^(n+2)-s^(n+2)|.       (T3)

The potentials converge uniformly as r->s. Their energies also converge: all source differences are supported in the protected compact ball, the sources converge vaguely by (T2), their masses are uniformly bounded, and the potentials converge uniformly; outside the ball both potentials and sources are unchanged. Thus (T3) is convergence in the frozen strong discrepancy sense on this bounded-energy family.

## 3. A uniform lower bound in the energy-difference norm

Let r!=s and h=u_r-u_s. For any decomposition h=A-B with A,B in the full completed cone C, linearity at q=1 gives mu_A-mu_B=mu_(u_r)-mu_(u_s) as original Radon measures. The right side has positive sphere component

    t (n-1)! r sigma_*(dS_r)

on E_r=sigma(partial B_r); neither the other sphere nor the absolutely continuous bulk terms charge E_r. Positivity of mu_A and mu_B therefore forces mu_A to dominate that component. The mixed energy inequality gives

    r(w) r(A) >= integral(-w) dmu_A
       >= t (n-1)! m omega r^n
       >= t (n-1)! m omega a^n=:c0>0.

Here r(w)>0: its smooth positive source on the protected ball and w<0 give positive energy. Taking the infimum over ALL completed decompositions in (T1), not only toric ones, proves

    ||u_r-u_s||_ed >= c0/r(w)  whenever r!=s.            (T4)

Hence strong discrepancy convergence, uniform convergence, and convergence of individual energies do not imply energy-difference norm convergence. The lower bound concerns a fixed original background and the full completed difference norm. No pointwise-order assumption has been substituted for additive order.

This also separates two source distances already distinguished in ED13. The signed source-functional dual norm tends to zero by ED11 and (T3). But the absolute weighted-variation expression tested against w/r(w) is bounded below by c0/r(w), and the ordinary total variation cannot tend to zero because the two sphere measures are mutually singular with masses bounded below. Signed cancellation is essential here.

## 4. An explicit bounded positive cone functional that is not literal Radon integration

Choose distinct R_j in [a,b] converging to R_* in (a,b), with R_j!=R_*. Let

    E=union_j sigma(partial B_(R_j)),
    F=(-w) 1_E.

E is Borel: each sphere image is compact, and the union is countable. F is a bounded nonnegative Borel function supported in a fixed original compact set. For A in C define

    ell(A)=integral F dmu_A.

This is finite, additive and positively homogeneous, because q=1 sources are linear and

    0<=ell(A)<=integral(-w)dmu_A<=r(w)r(A).

Extend to D_S by ell(A-B)=ell(A)-ell(B). The extension is well-defined: equality of two potential differences gives equality of their linear original source differences. Equation (T1) gives

    |ell(h)|<=r(w)||h||_ed.                             (T5)

So ell is a bounded real functional on the energy-difference Banach space, nonnegative on its cone. But mu_w(E)=0, and (T2) gives

    ell(u_(R_j))=t(n-1)! R_j integral_(partial B_Rj)(-w(sigma(x))) dS_x >=c0,
    ell(u_(R_*))=0.                                    (T6)

Thus ell is not strongly discrepancy-continuous on the cone, even on this uniformly bounded actual family. This explicitly separates the whole ED Banach dual from the subspace of functionals continuous for the frozen strong cone topology.

Moreover ell cannot be represented by literal integration against any signed locally finite original Radon measure nu on potentials. The differences h_j=u_(R_j)-u_(R_*) are supported in the fixed original compact set K=trop^{-1}(Bbar_b), and

    ||h_j||_infty <= t |R_j^2-R_*^2|/2 ->0.

A signed locally finite Radon measure therefore satisfies

    |integral h_j dnu| <= ||h_j||_infty |nu|(K) ->0,

whereas ell(h_j)>=c0 by (T6). This contradiction works with either sign convention for representation. No density of moment tests or all original smooth scalars is required.

This functional is not a positive Radon datum and therefore does NOT refute C1. Positivity on the energy cone and ED boundedness cannot replace literal Radon representation or strong continuity, exactly as already demonstrated abstractly by the frozen CG example.

## 5. Status boundaries

The exact sphere-source formula and full-cone lower bound are a new explicit high-dimensional realization within this work, with no global originality claim. The separation mechanism and dual-class obstruction were already proved in R12 CG1–CG10; do not count them again as a new C1 result. It neither changes the three completion definitions nor solves the arbitrary positive-Radon continuity gate. General A1/GQ/KC12/RV4, C1/SR8, B1, and C2 remain OPEN.
